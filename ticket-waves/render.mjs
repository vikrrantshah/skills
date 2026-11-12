#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

function fail(message) {
  console.error(`Error: ${message}`);
  process.exitCode = 1;
}

// Keep distinct IDs distinct when rendering arbitrary Unicode or control characters.
function ascii(value) {
  let output = '';
  for (const char of value) {
    const code = char.codePointAt(0);
    if (char === '\\') {
      output += '\\\\';
    } else if (code >= 32 && code <= 126) {
      output += char;
    } else {
      output += `\\u{${code.toString(16)}}`;
    }
  }
  return output;
}

function displayTitle(title) {
  return ascii(title.trim().replace(/\s+/gu, ' '));
}

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'variant' });

function compare(a, b) {
  const order = collator.compare(a, b);
  if (order !== 0) return order;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

const [N, E, S, W] = [1, 2, 4, 8];
const JUNCTIONS = {
  [S | E]: '┌', [S | W]: '┐', [N | E]: '└', [N | W]: '┘',
  [N | S | E]: '├', [N | S | W]: '┤', [E | W | S]: '┬', [E | W | N]: '┴', [N | E | S | W]: '┼',
};

// Crossings between segments in one gap, given their rows and lane order.
function laneCrossings(lanes, straights) {
  const pieces = straights.map((segment) => ({ owner: segment, y: segment.from.track.row, lo: -Infinity, hi: Infinity }));
  lanes.forEach((segment, x) => {
    pieces.push({ owner: segment, y: segment.from.track.row, lo: -Infinity, hi: x });
    pieces.push({ owner: segment, y: segment.to.track.row, lo: x, hi: Infinity });
  });
  let count = 0;
  lanes.forEach((segment, x) => {
    const top = Math.min(segment.from.track.row, segment.to.track.row);
    const bottom = Math.max(segment.from.track.row, segment.to.track.row);
    for (const piece of pieces) {
      if (piece.owner !== segment && piece.y > top && piece.y < bottom && piece.lo <= x && x <= piece.hi) count++;
    }
  });
  return count;
}

function improveBySwaps(order, score, apply = () => {}) {
  let best = score();
  for (let pass = 0, improved = true; improved && pass < 20; pass++) {
    improved = false;
    for (let i = 0; i + 1 < order.length; i++) {
      [order[i], order[i + 1]] = [order[i + 1], order[i]];
      apply();
      const next = score();
      if (next < best) {
        best = next;
        improved = true;
      } else {
        [order[i], order[i + 1]] = [order[i + 1], order[i]];
        apply();
      }
    }
  }
}

// Columns are waves; edges run prerequisite -> dependent. Edges spanning waves pass through
// intermediate columns on placeholder items. Each row is a track of items joined by straight edges.
function drawGraph(tickets, waves) {
  const waveOf = new Map();
  waves.forEach((ids, index) => ids.forEach((id) => waveOf.set(id, index)));
  const columns = waves.map((ids) => ids.map((id) => ({ id, label: ascii(id), wave: waveOf.get(id), ins: [], outs: [] })));
  const items = new Map(columns.flat().map((item) => [item.id, item]));
  const channels = waves.map(() => []);
  const link = (from, to, kind) => {
    const segment = { from, to, kind };
    from.outs.push(segment);
    to.ins.push(segment);
    channels[from.wave].push(segment);
  };
  for (const target of waves.flat()) {
    const ticket = tickets.get(target);
    const kinds = new Map();
    // An explicit blocker wins when a child also blocks its parent.
    for (const id of ticket.children) if (waveOf.has(id)) kinds.set(id, 'child');
    for (const id of ticket.blockedBy) if (waveOf.has(id)) kinds.set(id, 'block');
    for (const source of [...kinds.keys()].sort(compare)) {
      let from = items.get(source);
      for (let wave = from.wave + 1; wave < waveOf.get(target); wave++) {
        const placeholder = { id: null, label: '', wave, ins: [], outs: [] };
        columns[wave].push(placeholder);
        link(from, placeholder, kinds.get(source));
        from = placeholder;
      }
      link(from, items.get(target), kinds.get(source));
    }
  }

  // A row never both fans out of its left item and fans into its right item in the same gap,
  // so every junction on a row has one reading.
  const tracks = [];
  for (const column of columns) {
    for (const item of column) {
      const previous = item.ins.map((segment) => segment.from)
        .find((from) => from.track.items.at(-1) === from && (from.outs.length === 1 || item.ins.length === 1));
      item.track = previous?.track ?? { items: [], row: tracks.length };
      if (!previous) tracks.push(item.track);
      item.track.items.push(item);
    }
  }

  const order = tracks;
  const applyRows = () => order.forEach((track, row) => { track.row = row; });
  const segments = channels.flat();
  const orderLanes = (channel, refine) => {
    const straights = channel.filter((segment) => segment.from.track === segment.to.track);
    const bent = channel.filter((segment) => segment.from.track !== segment.to.track);
    const row = (item) => item.track.row;
    const down = bent.filter((segment) => row(segment.to) > row(segment.from))
      .sort((a, b) => row(b.to) - row(a.to) || row(b.from) - row(a.from));
    const up = bent.filter((segment) => row(segment.to) < row(segment.from))
      .sort((a, b) => row(a.to) - row(b.to) || row(a.from) - row(b.from));
    const scored = [[...down, ...up], [...up, ...down]].map((lanes) => ({ lanes, crossings: laneCrossings(lanes, straights) }));
    const chosen = scored[1].crossings < scored[0].crossings ? scored[1] : scored[0];
    if (refine) {
      improveBySwaps(chosen.lanes, () => laneCrossings(chosen.lanes, straights));
      chosen.crossings = laneCrossings(chosen.lanes, straights);
    }
    return chosen;
  };
  // Crossings dominate; shorter vertical runs break ties.
  const score = () => {
    let crossings = 0;
    let length = 0;
    for (const channel of channels) {
      crossings += orderLanes(channel, false).crossings;
      for (const segment of channel) length += Math.abs(segment.from.track.row - segment.to.track.row);
    }
    return crossings * 100000 + length;
  };
  let best = [...order];
  let bestScore = score();
  for (let iteration = 0; iteration < 40; iteration++) {
    const sums = new Map(order.map((track) => [track, [0, 0]]));
    for (const segment of segments) {
      const [a, b] = [segment.from.track, segment.to.track];
      if (a === b) continue;
      sums.get(a)[0] += b.row;
      sums.get(a)[1]++;
      sums.get(b)[0] += a.row;
      sums.get(b)[1]++;
    }
    const key = (track) => {
      const [sum, count] = sums.get(track);
      return count ? sum / count : track.row;
    };
    order.sort((a, b) => key(a) - key(b) || a.row - b.row);
    applyRows();
    const next = score();
    if (next < bestScore) [best, bestScore] = [[...order], next];
  }
  order.splice(0, order.length, ...best);
  applyRows();
  improveBySwaps(order, score, applyRows);

  const lanes = channels.map((channel) => orderLanes(channel, true).lanes);

  const widths = columns.map((column, index) => Math.max(`Wave ${index}`.length, ...column.map((item) => item.label.length)));
  const starts = [0];
  for (let index = 1; index < columns.length; index++) {
    starts.push(starts[index - 1] + widths[index - 1] + 2 * lanes[index - 1].length + 5);
  }
  const width = starts.at(-1) + widths.at(-1);
  const cells = order.map(() => Array.from({ length: width }, () => ({ mask: 0, solid: false })));
  const text = order.map(() => new Map());
  const mark = (y, x, bits, kind) => {
    cells[y][x].mask |= bits;
    if (kind === 'block') cells[y][x].solid = true;
  };
  const horizontal = (y, x1, x2, kind) => {
    for (let x = x1; x <= x2; x++) mark(y, x, (x < x2 ? E : 0) | (x > x1 ? W : 0), kind);
  };
  const vertical = (x, y1, y2, kind) => {
    const [top, bottom] = [Math.min(y1, y2), Math.max(y1, y2)];
    for (let y = top; y <= bottom; y++) mark(y, x, (y < bottom ? S : 0) | (y > top ? N : 0), kind);
  };

  for (const item of columns.flat()) {
    if (item.id) [...item.label].forEach((char, offset) => text[item.track.row].set(starts[item.wave] + offset, char));
  }
  channels.forEach((channel, wave) => {
    const gap = starts[wave] + widths[wave];
    for (const segment of channel) {
      const { from, to, kind } = segment;
      const x1 = from.id ? starts[wave] + from.label.length + 1 : starts[wave];
      const x2 = to.id ? starts[wave + 1] - 3 : starts[wave + 1];
      if (to.id) text[to.track.row].set(starts[wave + 1] - 2, '>');
      const lane = lanes[wave].indexOf(segment);
      if (lane < 0) {
        horizontal(from.track.row, x1, x2, kind);
      } else {
        const x = gap + 2 + 2 * lane;
        horizontal(from.track.row, x1, x, kind);
        vertical(x, from.track.row, to.track.row, kind);
        horizontal(to.track.row, x, x2, kind);
      }
    }
  });

  const glyph = ({ mask, solid }) => {
    if (!mask) return ' ';
    if (!(mask & (N | S))) return solid ? '─' : '┄';
    if (!(mask & (E | W))) return solid ? '│' : '┆';
    return JUNCTIONS[mask];
  };
  const header = Array(width).fill(' ');
  columns.forEach((_, index) => [...`Wave ${index}`].forEach((char, offset) => { header[starts[index] + offset] = char; }));
  const lines = [header.join('').trimEnd()];
  order.forEach((_, row) => {
    lines.push(cells[row].map((cell, x) => text[row].get(x) ?? glyph(cell)).join('').trimEnd());
  });
  waves.forEach((ids, index) => lines.push('', `Wave ${index}`, ids.map(ascii).join(', ')));
  return lines;
}

function render(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || !Array.isArray(input.tickets)) {
    throw new Error('input must be an object with a tickets array');
  }

  const tickets = new Map();
  for (const [index, ticket] of input.tickets.entries()) {
    const where = `tickets[${index}]`;
    if (!ticket || typeof ticket !== 'object' || Array.isArray(ticket)) {
      throw new Error(`${where} must be an object`);
    }
    if (typeof ticket.id !== 'string' || !ticket.id.trim()) {
      throw new Error(`${where}.id must be a nonempty string`);
    }
    if (tickets.has(ticket.id)) throw new Error(`duplicate ticket ID: ${ascii(ticket.id)}`);
    if (typeof ticket.title !== 'string' || !ticket.title.trim() || /[\r\n\u2028\u2029]/u.test(ticket.title)) {
      throw new Error(`${where}.title must be a nonempty single-line string`);
    }
    if (!['open', 'done', 'unresolved'].includes(ticket.state)) {
      throw new Error(`${where}.state must be open, done, or unresolved`);
    }
    for (const field of ['blockedBy', 'children']) {
      if (!Array.isArray(ticket[field]) || ticket[field].some((id) => typeof id !== 'string' || !id.trim())) {
        throw new Error(`${where}.${field} must be an array of nonempty ID strings`);
      }
    }
    const blockedBy = [...new Set(ticket.blockedBy)].sort(compare);
    const children = [...new Set(ticket.children)].sort(compare);
    // A parent starts only after all its children finish, so children are prerequisites like blockers.
    tickets.set(ticket.id, { ...ticket, blockedBy, children, prerequisites: [...new Set([...blockedBy, ...children])] });
  }
  // A ticket has at most one parent; it may have any number of blockers.
  const parentOf = new Map();
  for (const ticket of tickets.values()) {
    for (const child of ticket.children) {
      if (parentOf.has(child)) {
        throw new Error(`${ascii(child)} is listed as a child of both ${ascii(parentOf.get(child))} and ${ascii(ticket.id)}; a ticket has one parent`);
      }
      parentOf.set(child, ticket.id);
    }
  }

  const missing = new Set();
  const unresolved = [];
  const open = [];
  for (const ticket of tickets.values()) {
    if (ticket.state === 'done') continue;
    for (const id of ticket.prerequisites) if (!tickets.has(id)) missing.add(id);
    if (ticket.state === 'open') open.push(ticket.id);
    if (ticket.state === 'unresolved') unresolved.push(ticket.id);
  }

  const indegree = new Map();
  const dependents = new Map();
  for (const id of open) {
    let count = 0;
    for (const blocker of tickets.get(id).prerequisites) {
      if (tickets.get(blocker)?.state === 'done') continue;
      count++;
      if (tickets.get(blocker)?.state === 'open') {
        if (!dependents.has(blocker)) dependents.set(blocker, []);
        dependents.get(blocker).push(id);
      }
    }
    indegree.set(id, count);
  }

  const waves = [];
  const scheduled = new Set();
  let current = open.filter((id) => indegree.get(id) === 0);
  while (current.length) {
    current.sort(compare);
    waves.push(current);
    const next = [];
    for (const id of current) {
      scheduled.add(id);
      for (const dependent of dependents.get(id) ?? []) {
        const remaining = indegree.get(dependent) - 1;
        indegree.set(dependent, remaining);
        if (remaining === 0) next.push(dependent);
      }
    }
    current = next;
  }

  const residual = open.filter((id) => !scheduled.has(id)).sort(compare);
  const residualSet = new Set(residual);
  // Iterative DFS identifies a concrete cycle without treating its descendants as cyclic.
  const color = new Map();
  const active = [];
  const position = new Map();
  let cycle;
  for (const start of residual) {
    if (color.has(start) || cycle) continue;
    color.set(start, 1);
    position.set(start, active.length);
    active.push(start);
    const stack = [{ id: start, next: 0 }];
    while (stack.length && !cycle) {
      const frame = stack[stack.length - 1];
      const blockers = tickets.get(frame.id).prerequisites;
      if (frame.next === blockers.length) {
        color.set(frame.id, 2);
        position.delete(frame.id);
        active.pop();
        stack.pop();
        continue;
      }
      const blocker = blockers[frame.next++];
      if (!residualSet.has(blocker)) continue;
      if (color.get(blocker) === 1) {
        cycle = [...active.slice(position.get(blocker)), blocker].reverse();
      } else if (!color.has(blocker)) {
        color.set(blocker, 1);
        position.set(blocker, active.length);
        active.push(blocker);
        stack.push({ id: blocker, next: 0 });
      }
    }
  }

  const lines = waves.length ? drawGraph(tickets, waves) : [];
  if (residual.length || unresolved.length || missing.size) {
    if (lines.length) lines.push('');
    lines.push('Unscheduled - resolve blockers first');
    const pending = (other) => tickets.get(other)?.state !== 'done' && !scheduled.has(other);
    for (const id of residual) {
      const ticket = tickets.get(id);
      const blockers = ticket.blockedBy.filter(pending);
      const children = ticket.children.filter(pending);
      lines.push(`  ${ascii(id)}: ${displayTitle(ticket.title)}`
        + (blockers.length ? ` [blocked by: ${blockers.map(ascii).join(', ')}]` : '')
        + (children.length ? ` [children: ${children.map(ascii).join(', ')}]` : ''));
    }
    for (const id of unresolved.sort(compare)) lines.push(`  ${ascii(id)}: ${displayTitle(tickets.get(id).title)} [unresolved]`);
    for (const id of [...missing].sort(compare)) lines.push(`  ${ascii(id)} [missing]`);
  }
  if (cycle) lines.push(`Cycle: ${cycle.map(ascii).join(' -> ')}`);
  if (!open.length && !unresolved.length && !missing.size) lines.push('No open work');
  return { output: `${lines.join('\n')}\n`, hasIssues: residual.length > 0 || unresolved.length > 0 || missing.size > 0 };
}

async function main() {
  if (process.argv.length !== 3) throw new Error('usage: node render.mjs <graph.json | ->');
  const source = process.argv[2] === '-' ? '/dev/stdin' : process.argv[2];
  let text;
  try {
    text = await readFile(source, 'utf8');
  } catch (error) {
    throw new Error(`cannot read input: ${error.message}`);
  }
  let input;
  try {
    input = JSON.parse(text);
  } catch (error) {
    throw new Error(`invalid JSON: ${error.message}`);
  }
  const result = render(input);
  process.stdout.write(result.output);
  if (result.hasIssues) process.exitCode = 2;
}

main().catch((error) => fail(error.message));
