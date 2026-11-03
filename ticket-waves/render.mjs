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
    if (!Array.isArray(ticket.blockedBy) || ticket.blockedBy.some((id) => typeof id !== 'string' || !id.trim())) {
      throw new Error(`${where}.blockedBy must be an array of nonempty ID strings`);
    }
    tickets.set(ticket.id, { ...ticket, blockedBy: [...new Set(ticket.blockedBy)] });
  }

  const missing = new Set();
  const unresolved = [];
  const open = [];
  for (const ticket of tickets.values()) {
    if (ticket.state === 'done') continue;
    for (const id of ticket.blockedBy) if (!tickets.has(id)) missing.add(id);
    if (ticket.state === 'open') open.push(ticket.id);
    if (ticket.state === 'unresolved') unresolved.push(ticket.id);
  }

  const indegree = new Map();
  const dependents = new Map();
  for (const id of open) {
    let count = 0;
    for (const blocker of tickets.get(id).blockedBy) {
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
      const blockers = tickets.get(frame.id).blockedBy;
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

  const sections = [];
  for (const [level, ids] of waves.entries()) {
    sections.push({ heading: `Level ${level} - parallel`, items: ids.map((id) => {
      const ticket = tickets.get(id);
      const after = ticket.blockedBy.filter((blocker) => tickets.get(blocker)?.state !== 'done').sort(compare);
      return `${ascii(id)}: ${displayTitle(ticket.title)}${after.length ? ` [after: ${after.map(ascii).join(', ')}]` : ''}`;
    }) });
  }
  if (residual.length || unresolved.length || missing.size) {
    const items = residual.map((id) => {
      const ticket = tickets.get(id);
      const blockers = ticket.blockedBy.filter((blocker) => tickets.get(blocker)?.state !== 'done' && !scheduled.has(blocker)).sort(compare);
      return `${ascii(id)}: ${displayTitle(ticket.title)} [blocked by: ${blockers.map(ascii).join(', ')}]`;
    });
    for (const id of unresolved.sort(compare)) items.push(`${ascii(id)}: ${displayTitle(tickets.get(id).title)} [unresolved]`);
    for (const id of [...missing].sort(compare)) items.push(`${ascii(id)} [missing]`);
    sections.push({ heading: 'Unscheduled - resolve blockers first', items });
  }
  if (cycle) sections.push({ heading: `Cycle: ${cycle.map(ascii).join(' -> ')}`, items: [] });
  if (!open.length && !unresolved.length && !missing.size) sections.push({ heading: 'No open work', items: [] });

  const lines = ['Execution waves'];
  sections.forEach((section, index) => {
    const last = index === sections.length - 1;
    lines.push(`${last ? '`--' : '|--'} ${section.heading}`);
    section.items.forEach((item, itemIndex) => {
      lines.push(`${last ? '   ' : '|  '}${itemIndex === section.items.length - 1 ? '`--' : '|--'} ${item}`);
    });
  });
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
