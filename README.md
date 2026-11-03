# Skills

My agent skills, in the [Agent Skills](https://agentskills.io) format: one directory per skill, `<name>/SKILL.md` plus whatever it points at.

Every skill here is user-invoked (`disable-model-invocation: true`). Nothing fires on its own, and nothing occupies the system prompt until I type its name.

## Installation

### On the machine where I author them

```bash
git clone git@github.com:vikrrantshah/skills.git ~/Documents/skills
~/Documents/skills/install.sh
```

Symlinks every skill into each agent's skills directory, so an edit here is live with no re-install:

| Agent | Directory |
| --- | --- |
| Claude Code | `~/.claude/skills/` |
| omp | `~/.agents/skills/` |

omp reads `~/.agents/skills` through its `agents` provider, and ignores `~/.claude/skills` unless that foreign provider is switched on. Send the links elsewhere with `SKILLS_DIRS="dir1 dir2" ./install.sh`.

### Anywhere else

```bash
npx skills add vikrrantshah/skills -g -a claude-code -a cline
npx skills update
```

[`skills`](https://github.com/vercel-labs/skills) clones this private repo with whatever git or `gh` credentials the machine already has; `GITHUB_TOKEN` is needed only where neither exists. The CLI has no `omp` target, so borrow `cline` (or `zed`, `warp`, `dexto`) — its global path is `~/.agents/skills`, where omp looks. These land as copies, frozen at the last `skills update`.

## Skills

### create-worktree

`/create-worktree` in Claude Code, `/skill:create-worktree` in omp.

Resolves a branch name — the tracker's own where it publishes one, otherwise built from the ticket or description against the repo's existing branch convention — creates that branch and its worktree with [`wt`](https://worktrunk.dev), then moves the ticket to in-progress and hands back without touching the code.

**Use when:**

- Starting an implementation from a ticket, on any tracker
- Starting one from a description, with no ticket at all
- Picking work back up: re-running switches to the existing worktree instead of creating a second one

### pitch-sheet

`/pitch-sheet` in Claude Code, `/skill:pitch-sheet` in omp.

Builds a playful, scroll-scrubbed pitch page with GSAP-pinned scenes, hand-marker captions, and a pixel-art mascot. Includes a reusable visual kit, a CSS checker, and a browser verification workflow for desktop and phone widths.

### ticket-waves

`/ticket-waves` in Claude Code, `/skill:ticket-waves` in omp.

Draws an ASCII ticket tree from explicit blocking relationships. Each level contains tickets that can run in parallel after earlier levels finish. Reads tickets without changing them.

Accepts ticket lists, parent tickets, projects, or milestones. Includes unfinished prerequisites and reports cycles or unresolved blockers without giving blocked tickets an executable level.

Example: `/ticket-waves NX-123 and its subtasks`

Requires Node.js for the bundled dependency renderer. Tracker access uses the agent's available MCP or CLI tools.

## Skills by other authors

Skills by other authors I like to use:

- [brag](https://github.com/latent-spaces/brag)
- [Matt Pocock's skills](https://github.com/mattpocock/skills)
