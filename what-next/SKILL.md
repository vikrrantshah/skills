---
name: what-next
description: Recover session context and identify the exact next action, with human or agent ownership.
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

Assign each action to an owner:

- **Agent**: investigation, implementation, checks, or other work the agent can perform with available tools and authority.
- **Human**: a required decision, approval, credential entry, physical task, or action outside the agent's access or authority.
  Name the person or role only when the evidence identifies them. Do not infer that the user owns every human task.

A missing fact the agent can retrieve is agent work, not a question for the user.
For human decisions, state the exact question, the material choices, and a recommendation when evidence supports one.
For human actions, name the exact target and the observable result that permits work to continue.
Include a command only when its syntax and target are supported by the inspected context.

If blocked on an external event, identify the responsible party or system and the condition for resuming.
If an agent already performs the next action, mark it **in progress** instead of recommending duplicate work.
If the requested goal is complete, say **Done**. Include a next action only for a remaining obligation within the agreed scope.

## Reply

Put the immediate action first. Use this shape, omitting empty sections:

**Next · Human/Agent:** One concrete action, its exact target, and its completion condition.
**Context:** One sentence naming the goal and the last confirmed result.
**Then:** Up to three ordered actions, each with Human/Agent ownership and any prerequisite.
**Blocked / unknown:** The blocker or missing evidence, who can resolve it, and the condition for resuming.

For a completed goal, replace **Next** with **Done:** and the confirmed outcome.
Keep the reply under 180 words for one session. Prefer fewer actions to a speculative backlog.
Attach paths, issue IDs, commands, or links to the action they support. Distinguish confirmed facts from unverified claims.
Include both human and agent work only when each has a real remaining responsibility.

When the user requests several sessions, give one compact row per session:

| Session / goal | Confirmed state | Next action | Owner | Blocked on |
| --- | --- | --- | --- | --- |

State each fact once. Omit **Blocked / unknown** when **Next** already explains the blocker and its resolution.

Choose one session to resume first using explicit priorities, then dependency order.
If neither distinguishes them, recommend one ready session and state the basis without inventing urgency.
Keep the table as the sole per-session summary. Do not duplicate it as a narrative or silently omit requested sessions.
