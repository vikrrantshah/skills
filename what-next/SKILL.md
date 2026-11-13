---
name: what-next
description: Recover session context and identify the exact next action and its owner (user, agent, named teammate, system, or external party).
argument-hint: "Optional: session or workstream to inspect"
disable-model-invocation: true
---

# What next

Give the user a read-only checkpoint so they can resume work without reconstructing the conversation.
Report the next action. Do not perform it, change files, update tickets, or start jobs.

## Recover the state

1. Default to the current conversation and workstream. Inspect another session only when the user requests it.
2. Extract the latest goal, acceptance criteria, completed work, unfinished work, blockers, and decisions.
   Account for every remaining acceptance criterion, including human responsibilities and agent responsibilities.
   Treat plans and agent claims as proposals until evidence shows completion. Preserve the user's latest corrections.
3. Resolve only gaps that could change the next action. Use the smallest relevant read-only lookup.
   Check live state when an action depends on a mutable fact, such as PR status or a running job.
   Do not rerun checks or wait for jobs just to produce this checkpoint.
4. If another session is requested, use available session discovery and history tools.
   Keep each session's evidence separate. Do not claim access to sessions that the tools cannot expose.
   If essential context remains unavailable, name it and state the smallest action needed to recover it.

## Select the next action

Choose one immediate action that advances the goal or removes its first blocking dependency.
Prefer ready work over work that depends on an unfinished step.
For several ready actions, prefer the action that unblocks the rest. Use explicit user priorities first.

Assign each action exactly one owner:

- **User**: the person working with this agent. Covers decisions, approvals, credential entry, physical tasks,
  and actions that need the user's access or authority.
- **Agent**: investigation, implementation, checks, or other work the agent can perform with available tools and authority.
- **Teammate: <Name>**: a named member of the user's team or organization, such as a PR reviewer, ticket assignee, or code owner.
  Always use the person's name from the evidence. If the owner is unnamed and a tool can identify them
  (ticket assignee, requested reviewers, CODEOWNERS), identifying them is Agent work. Otherwise the action is User: name the owner.
- **System**: a process the work waits on, such as a CI run, `gh run`, build, deploy, queue, or scheduled job.
  Name the exact run, job, or URL and the result that lets work continue.
- **External: <Party>**: a person or organization outside the user's organization, such as a vendor, customer,
  upstream maintainer, or support desk. Name the party when evidence identifies it; otherwise name the role.

Do not assign a teammate's or external party's task to the user.
If a named person's affiliation is unverified, use Teammate and mark the affiliation unverified.

A missing fact the agent can retrieve is Agent work, not a question for the user.
For User or Teammate decisions, state the exact question, the material choices, and a recommendation when evidence supports one.
For User or Teammate actions, name the exact target and the observable result that permits work to continue.
Include a command only when its syntax and target are supported by the inspected context.

System and External owners mean waiting. Prefer a ready User, Agent, or Teammate action over a wait.
When nothing else is ready, make the wait the next action: name the run or party, the condition for resuming,
and who acts once it resolves. A nudge, such as a reminder to an external party, belongs to whoever sends it.
If an agent or system process is already doing the next action, mark it **in progress** instead of recommending duplicate work or a rerun.
If the requested goal is complete, say **Done**. Include a next action only for a remaining obligation within the agreed scope.

### Optional ticket housekeeping

Keep delivery completion separate from ticket bookkeeping. A stale tracker status alone does not make completed delivery unfinished.
When a completed goal has a ticket, use a bounded read-only lookup to check whether its status and completion evidence match.
If a gap exists, or reconciliation remains unverified, offer **Optional · Agent:** Preview ticket housekeeping with `ticket-housekeeping <ticket>`.
Name confirmed gaps; label unknown tracker state as unverified. Keep **Done** as the primary result.
If the ticket already matches the confirmed outcome, omit the offer. For work without a ticket, omit it too.
This offer is not a required next action. The user chooses whether to invoke the separate skill; do not invoke it automatically.

## Reply

Put the immediate action first. Use this shape, omitting empty sections:

**Next · Owner:** One concrete action, its exact target, and its completion condition.
Owner is one of `User`, `Agent`, `Teammate: <Name>`, `System`, or `External: <Party>`.
**Context:** One sentence naming the goal and the last confirmed result.
**Then:** Up to three ordered actions, each with its owner and any prerequisite.
**Blocked / unknown:** The blocker or missing evidence, who can resolve it, and the condition for resuming.

For a completed goal, replace **Next** with **Done:** and the confirmed outcome.
When appropriate, append the optional housekeeping offer after **Done**, within the same word limit.
Keep the reply under 180 words for one session. Prefer fewer actions to a speculative backlog.
Attach paths, issue IDs, commands, or links to the action they support. Distinguish confirmed facts from unverified claims.
Include several owners only when each has a real remaining responsibility.

When the user requests several sessions, give one compact row per session:

| Session / goal | Confirmed state | Next action | Owner | Blocked on |
| --- | --- | --- | --- | --- |

State each fact once. Omit **Blocked / unknown** when **Next** already explains the blocker and its resolution.

Choose one session to resume first using explicit priorities, then dependency order.
If neither distinguishes them, recommend one ready session and state the basis without inventing urgency.
Keep the table as the sole per-session summary. Do not duplicate it as a narrative or silently omit requested sessions.
