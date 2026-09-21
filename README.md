# skills

Private Claude Code / agent skills.

Each top-level directory is one skill: `<name>/SKILL.md` plus any files it points at.

## Install

```bash
./install.sh
```

Symlinks every skill into each agent's skills directory, so edits here are live with no re-install:

| Agent | Directory |
| --- | --- |
| Claude Code | `~/.claude/skills/` |
| omp | `~/.agents/skills/` — its `agents` provider; omp does not read `~/.claude/skills` unless that foreign provider is enabled |

Override the targets with `SKILLS_DIRS="dir1 dir2" ./install.sh`. Existing real directories are left alone and reported.

On a machine that tracks skills with [`npx skills`](https://github.com/vercel-labs/skills) instead, install copies from the private repo — git/`gh` credentials are picked up automatically:

```bash
npx skills add vikrrantshah/skills -g -a claude-code -a cline -y   # cline's global path is ~/.agents/skills, where omp looks
npx skills update worktree                                         # pull later changes
```

The CLI has no `omp` target; `cline`, `zed`, `warp`, and `dexto` all map to `~/.agents/skills/`. Copies go stale until `skills update`, so prefer `install.sh` on the machine where you author.

## Skills

| Skill | What it does |
| --- | --- |
| [`worktree`](worktree/SKILL.md) | Names a branch from a ticket (Linear / GitHub / Jira) or a description, then creates the branch and worktree with [`wt`](https://worktrunk.dev). |
