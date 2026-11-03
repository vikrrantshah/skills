---
name: ticket-waves
description: Draw an ASCII ticket tree grouped into parallel execution levels from blocking relationships.
disable-model-invocation: true
---

# Ticket waves

Turn ticket blockers into execution waves. Every ticket at level N can run after all earlier levels finish. Parallel means dependency-safe, not conflict-free: staffing and shared-file constraints remain separate.

This skill reads tickets and draws a plan. It does not change tickets or start implementation.

## 1. Pin the scope

Use the tickets, parent ticket, project, or milestone named by the user or established in the conversation. Ask for scope only when neither supplies one.

For a parent ticket, include its descendants. For a project or milestone, retrieve every page. A parent/child relationship defines scope, not execution order.

## 2. Resolve the graph

Fetch each ticket's identifier, title, status, URL, and explicit blocking relationships through available tracker tools. Batch independent reads and cache each fetched ticket for this run.

For Linear, `get_issue` with `includeRelations: true` returns relations. If you select `fields`, include `relations` explicitly: field selection overrides the include option. Ticket lists alone do not supply blocking relations.

Normalize every edge as **prerequisite -> dependent**: if A blocks B, B's `blockedBy` contains A. Related links, duplicate links, parents, priorities, and list order do not imply blocking edges. If only outgoing `blocks` relations are available, invert them.

Follow incoming blockers recursively until every referenced prerequisite is resolved. Include unfinished prerequisites outside the original scope, and identify these additions in the response. If the user requires a strict scope, keep unfinished external prerequisites unresolved instead. Do not expand through unrelated downstream tickets.

Normalize ticket states:

- `open`: unfinished work, including tickets already in progress.
- `done`: confirmed completed work, or a prerequisite the user explicitly says is satisfied.
- `unresolved`: unavailable status or blocker list, inaccessible ticket, strict-scope external prerequisite, or canceled work whose dependency remains unsatisfied.

Completed prerequisites satisfy their edges. Cancellation, archival, and missing information alone do not prove completion. Skip a completed ticket's historical blocker chain unless that ticket is also needed for scope discovery.

When relationships are unavailable, request a pasted blocker list. Mark the affected ticket `unresolved` until its blocker list is confirmed complete. An unavailable list is not an empty list. Distinguish user-supplied relationships from live tracker data; never invent edges from ticket titles.

Finish when each selected ticket and each unfinished prerequisite has a normalized record, or an explicit unresolved record.

## 3. Calculate the levels

Write a temporary JSON file with this shape:

```json
{
  "tickets": [
    {"id": "NX-1", "title": "Define contract", "state": "open", "blockedBy": []},
    {"id": "NX-2", "title": "Build API", "state": "open", "blockedBy": ["NX-1"]},
    {"id": "NX-3", "title": "Build client", "state": "open", "blockedBy": ["NX-1"]},
    {"id": "NX-4", "title": "Integrate", "state": "open", "blockedBy": ["NX-2", "NX-3"]}
  ]
}
```

Use a unique temporary path outside the repository. Run the bundled renderer, resolving its path from this skill directory:

```bash
node <skill-directory>/render.mjs <temporary-graph.json>
```

The renderer uses batched topological sorting. Level 0 contains every open ticket with satisfied prerequisites. Each subsequent level contains every newly available ticket after the previous batch finishes. This is longest-prerequisite depth, not shortest distance from a root. Each open ticket appears once; shared prerequisites do not duplicate subtrees.

Exit codes:

- `0`: all open tickets have levels, or no open work remains.
- `1`: invalid input or an unreadable file. Correct the input and rerun.
- `2`: unresolved blockers or a cycle. Keep the partial plan and resolve the reported graph issues before claiming a complete schedule.

Delete the temporary file after capturing the output.

## 4. Present the tree

Return the renderer's output in a plain-text code block. Preserve its ASCII connectors and level assignments. Level groups are branches of the execution plan, not parent tickets.

Show direct unfinished blockers beside each dependent. Report cycles and unresolved tickets separately from executable levels; downstream tickets of a cycle are blocked, not necessarily cyclic themselves.

Outside the tree, state the scope, provide tracker links keyed by identifier, and identify any added prerequisites or source limitations. In-progress tickets at level 0 are dependency-ready, not necessarily unclaimed. Present inferred sequencing only if requested, separately from the explicit-edge plan.

Before handing back, account for every open ticket exactly once, with every scheduled blocker in an earlier level or completed. A partial graph supports only a partial plan.
