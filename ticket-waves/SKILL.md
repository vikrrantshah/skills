---
name: ticket-waves
description: Draw a horizontal ticket graph whose columns are parallel execution waves, with blocking and parent/child edges.
disable-model-invocation: true
---

# Ticket waves

Turn ticket blockers and sub-ticket hierarchies into execution waves. Every ticket in wave N can run after all earlier waves finish. A parent comes after its children: every child of a wave-N ticket sits in waves 0 to N-1. Parallel means dependency-safe, not conflict-free: staffing and shared-file constraints remain separate.

This skill reads tickets and draws a plan. It does not change tickets or start implementation.

## 1. Pin the scope

Use the tickets, parent ticket, project, or milestone named by the user or established in the conversation. Ask for scope only when neither supplies one.

For a parent ticket, include the parent and all its descendants. For a project or milestone, retrieve every page.

## 2. Resolve the graph

Build the full relationship graph before calculating any wave. Two edge kinds define order, both normalized as **prerequisite -> dependent**:

- **Blocking:** if A blocks B, B's `blockedBy` contains A. A ticket can have any number of blockers. If only outgoing `blocks` relations are available, invert them; if both directions are available, take their union.
- **Parent/child:** a parent depends on each child. The parent's `children` lists every direct child, whatever its state. A ticket has at most one parent, so it appears in at most one `children` list; the renderer rejects input that lists a ticket under two parents.

Related links, duplicate links, priorities, and list order do not imply edges.

For every ticket in the graph, fetch its identifier, title, status, URL, blocking relations, and direct children. Batch independent reads and cache each fetched ticket for this run. Children and blocking relations come from different calls; one alone is never the full record.

For Linear:

- `get_issue` with `includeRelations: true` returns `relations.blocks` and `relations.blockedBy`. If you select `fields`, include `relations` explicitly: field selection overrides the include option. Relation entries carry only identifier and title; fetch each referenced ticket for its status.
- `get_issue` does not return children. Call `list_issues` with `parentId` for every ticket in the graph, following `cursor` until `hasNextPage` is false. That list does not supply blocking relations, so each child still needs its own `get_issue`.

Expand the graph until it closes:

- Children: recurse to every descendant of every ticket in the graph, including descendants of added prerequisites. A parent's wave depends on its whole subtree.
- Blockers: follow `blockedBy` recursively and add every unfinished prerequisite, including tickets outside the original scope. Identify these additions in the response. If the user requires a strict scope, mark unfinished external prerequisites `unresolved` instead.
- Do not expand through unrelated downstream tickets: a ticket's `blocks` list, or its own parent outside scope, adds no tickets.

Normalize ticket states:

- `open`: unfinished work, including tickets already in progress.
- `done`: confirmed completed work, or a prerequisite the user explicitly says is satisfied.
- `unresolved`: unavailable status, blocker list, or child list; inaccessible ticket; strict-scope external prerequisite; or canceled work whose dependency remains unsatisfied.

Completed prerequisites satisfy their edges. Cancellation, archival, and missing information alone do not prove completion. Skip a completed ticket's historical blocker chain unless that ticket is also needed for scope discovery.

When relationships are unavailable, request a pasted blocker or child list. Mark the affected ticket `unresolved` until both lists are confirmed complete. An unavailable list is not an empty list. Distinguish user-supplied relationships from live tracker data; never invent edges from ticket titles.

Before calculating waves, check that the graph is closed:

- Every ticket has a status, a blocker list, and a child list, or is `unresolved`.
- Every ID in any `blockedBy` or `children` list has its own record.
- Every ticket whose `parentId` is in the graph appears in that parent's `children`.

## 3. Calculate the waves

Write a temporary JSON file with this shape:

```json
{
  "tickets": [
    {"id": "APP-1", "title": "Ship checkout", "state": "open", "blockedBy": [], "children": ["APP-2", "APP-3", "APP-4", "APP-5"]},
    {"id": "APP-2", "title": "Define contract", "state": "open", "blockedBy": [], "children": []},
    {"id": "APP-3", "title": "Build API", "state": "open", "blockedBy": ["APP-2"], "children": []},
    {"id": "APP-4", "title": "Build client", "state": "open", "blockedBy": ["APP-2"], "children": []},
    {"id": "APP-5", "title": "Integrate", "state": "open", "blockedBy": ["APP-3", "APP-4"], "children": []}
  ]
}
```

Use a unique temporary path outside the repository. Run the bundled renderer, resolving its path from this skill directory:

```bash
node <skill-directory>/render.mjs <temporary-graph.json>
```

The renderer treats `blockedBy` and `children` as prerequisites and uses batched topological sorting. Wave 0 contains every open ticket with satisfied prerequisites. Each subsequent wave contains every newly available ticket after the previous wave finishes. This is longest-prerequisite depth, not shortest distance from a root. A parent therefore lands one wave after its deepest unfinished child (APP-1 above lands in wave 3). Each open ticket appears once.

It draws a horizontal graph. Column `Wave <n>` is wave n, read left to right. Each edge runs from a prerequisite to its dependent: `──>` for blocking, `┄┄>` for child to parent. When a child also blocks its parent, the edge is drawn as blocking. Edges that skip waves pass through the columns between them. `┼` is always a crossing, never a junction. Below the graph, each wave is listed as a `Wave <n>` heading followed by its ticket identifiers. Unscheduled tickets and cycles are listed last. The output has no symbol legend.

Exit codes:

- `0`: every open ticket has a wave, or no open work remains.
- `1`: invalid input or an unreadable file. Correct the input and rerun.
- `2`: unresolved prerequisites, missing children or blockers, or a cycle. Keep the partial plan and resolve the reported graph issues before claiming a complete schedule. A parent that blocks its own descendant forms a cycle.

Delete the temporary file after capturing the output.

## 4. Present the graph

Return the renderer's output unchanged in a plain-text code block: graph, wave list, and any unscheduled list. Do not redraw, reflow, or trim it, because its alignment carries the edges. If the graph is wider than the reader's view, say so rather than rearranging it. Do not add a legend; explain the symbols only when the user asks, using the meanings above.

Report cycles and unresolved tickets separately from executable waves; downstream tickets of a cycle are blocked, not necessarily cyclic themselves.

Outside the graph, state the scope, provide tracker links keyed by identifier, and identify any added prerequisites or source limitations. In-progress tickets in wave 0 are dependency-ready, not necessarily unclaimed. Present inferred sequencing only if requested, separately from the explicit-edge plan.

Before handing back, account for every open ticket exactly once, with every scheduled blocker and child in an earlier wave or completed. A partial graph supports only a partial plan.
