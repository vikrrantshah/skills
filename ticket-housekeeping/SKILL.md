---
name: ticket-housekeeping
description: Reconcile a ticket with the confirmed outcome of its work.
argument-hint: "Optional: ticket reference; add --apply to make updates"
disable-model-invocation: true
---

# Ticket housekeeping

Reconcile one ticket with confirmed delivery evidence. Keep delivery status separate from tracker status.

## Authority

Default to a read-only preview. Write only when the user invokes this skill with `--apply`,
or explicitly asks to apply a specific preview. Invoking `/what-next` never authorizes these writes.
An authorized `--apply` invocation needs no second approval prompt. Follow tracker and product policies.
Apply only changes within the user's authorization. A preview does not authorize later changes by itself.

## Resolve the ticket and evidence

1. Use the explicit ticket argument, if present. Otherwise use the current workstream only when it identifies one ticket unambiguously.
   Do not mix evidence from other sessions or guess a ticket. Ask for the ticket if the target remains ambiguous.
2. Use available tracker MCP or CLI read tools to fetch the live ticket, description, acceptance criteria, comments, and workflow states.
   Read linked PRs and relevant verification evidence with available tools. Identify existing checklist entries and prior updates.
3. Match evidence to each acceptance criterion. Distinguish verified outcomes from claims and missing evidence.
   An unsupported agent claim is not proof. A merge alone is not completion when agreed acceptance remains.
   Require review, merge, deployment, or human validation only when the agreed criteria require them.
   Do not rerun tests, builds, or deployments. Do not implement work during housekeeping.
4. Retrieve essential context that available tools can access. Ask the user only for essential context that remains inaccessible.
   If evidence is missing, report the affected criteria as unverified and identify who can supply it.

## Prepare the changes

Propose only changes justified by the evidence:

- Select an accurate state from the ticket's actual workflow. Do not close an incomplete ticket.
- Add a concise progress or completion comment with verified outcomes, evidence links, and verification limits.
- Mark only checklist criteria supported by evidence. Use localized description edits when appropriate.

Partial progress can be recorded without closing the ticket. Preserve unrelated description text, labels, assignee,
priority, milestones, and relations. Do not create follow-up tickets, modify parents or siblings, or delete tickets or comments.
Do not merge, deploy, or clean up branches or worktrees unless separately requested.

Compare proposed changes with existing status, comments, and checklist entries. Reuse existing evidence.
Skip unchanged fields and duplicate comments. If all relevant fields already match, report **No housekeeping needed**.
In preview, show the exact proposed changes and stop without writing.

## Apply and report

Before applying, read fresh relevant tracker state. Skip or adjust proposals that are already applied or no longer supported.
Apply only minimal authorized fields. After each write, read the affected state to verify it.
If a write fails ambiguously, read state before any retry. Do not create a duplicate comment.
Report each successful and failed change separately. Never report a failed or unverified write as successful.
If write access is unavailable, show the exact manual changes and assign them to a Human.

Reply concisely with the target, preview/applied/no changes, proposed or actual changes, and supporting evidence.
Include verification limits and remaining Human or Agent obligations when applicable.
State delivery completion separately from the result of ticket housekeeping.
