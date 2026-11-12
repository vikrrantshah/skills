# Skills

My agent skills, in the [Agent Skills](https://agentskills.io) format: one directory per skill, `<name>/SKILL.md` plus whatever it points at.

Every skill here is user-invoked (`disable-model-invocation: true`). Nothing fires on its own, and nothing occupies the system prompt until I type its name.

## Installation

```bash
npx skills add vikrrantshah/skills -g -a claude-code -a cline
npx skills update --global
```

Installs at user scope. Use `npx skills add` to install new skills; `npx skills update --global` refreshes skills already installed.

The CLI has no `omp` target. Use `cline` (or `zed`, `warp`, `dexto`) to install into `~/.agents/skills`, where omp looks.
The `claude-code` target installs into `~/.claude/skills`.

[`skills`](https://github.com/vercel-labs/skills) accesses this private repo through the machine's git or `gh` credentials.
`GITHUB_TOKEN` is needed only when neither is available. Run the update command to get later changes.

## Skills

### create-worktree

Resolves a branch name — the tracker's own where it publishes one, otherwise built from the ticket or description against the repo's existing branch convention — creates that branch and its worktree with [`wt`](https://worktrunk.dev), then moves the ticket to in-progress and hands back without touching the code.

**Use when:**

- Starting an implementation from a ticket, on any tracker
- Starting one from a description, with no ticket at all
- Picking work back up: re-running switches to the existing worktree instead of creating a second one

### pitch-sheet

Builds a playful, scroll-scrubbed pitch page with GSAP-pinned scenes, hand-marker captions, and a pixel-art mascot. Includes a reusable visual kit, a CSS checker, and a browser verification workflow for desktop and phone widths.

### ticket-waves

Draws a horizontal ticket graph whose columns are execution waves, with blocking and parent/child relationships as edges. Each wave contains tickets that can run in parallel after earlier waves finish; a parent always lands after all its children. Reads tickets without changing them.

Accepts ticket lists, parent tickets, projects, or milestones. Includes unfinished prerequisites and reports cycles or unresolved blockers without assigning blocked tickets to a wave.

Example: `/ticket-waves APP-123 and its subtasks`

Requires Node.js for the bundled dependency renderer. Tracker access uses the agent's available MCP or CLI tools.

### brief-me

Explains the work with an unlabelled, one-to-three-line goal summary first, then only the context, confirmed progress, and remaining work the user needs.
Uses ASD-STE100 writing rules for clear, concise language without claiming unchecked compliance.

Accepts a ticket, goal, or workstream. Defaults to the current conversation and uses the same format with or without a ticket.
Read-only: it explains the work without continuing implementation or updating the tracker.

Examples: `/brief-me APP-42` or `/brief-me remind me what we are working toward and what remains`

### what-next

Recovers session context and identifies the exact next action, with human or agent ownership. Reports blockers and follow-on actions without executing them.

Defaults to the current session. Accepts an explicit session or workstream, including several sessions when history access is available.

After completed ticket work, it can suggest optional `ticket-housekeeping`. This does not change its read-only behavior.

### ticket-housekeeping

Reconciles a ticket's status, completion evidence, and acceptance checklist with confirmed work. Keeps required delivery separate from optional bookkeeping.

The default is a read-only preview. Add `--apply` to write the updates. Repeated runs skip unchanged fields and duplicate comments.

Example: `/ticket-housekeeping APP-123 --apply`

Uses the available tracker tools. Leaves incomplete tickets open when acceptance criteria remain unverified.

## Skills by other authors

Skills by other authors I like to use:

- [brag](https://github.com/latent-spaces/brag)
- [Matt Pocock's skills](https://github.com/mattpocock/skills)
