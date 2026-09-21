# skills

Private Claude Code / agent skills.

Each top-level directory is one skill: `<name>/SKILL.md` plus any files it points at.

## Install

```bash
./install.sh
```

Symlinks every skill directory into `~/.claude/skills/`, so edits here are live immediately. Existing real directories of the same name are left alone and reported.

## Skills

| Skill | What it does |
| --- | --- |
| [`worktree`](worktree/SKILL.md) | Names a branch from a ticket (Linear / GitHub / Jira) or a description, then creates the branch and worktree with [`wt`](https://worktrunk.dev). |
