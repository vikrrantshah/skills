---
name: worktree
description: Create a branch and its git worktree with the `wt` CLI, named from a tracker ticket or a description. Use when starting an implementation, when asked for a worktree, or when handed a ticket to work on (Linear, GitHub issue, Jira, or plain prose).
---

# Worktree

Turn a piece of work into a branch name, then let `wt` create the worktree for it.

## 1. Pin the work item

You need exactly one of: a tracker reference (ticket key, issue number, or URL) or a description concrete enough to name a branch.

Take it from the user's message or from what the conversation already established. If neither carries one, **ask the user and stop** until they answer. Never invent a ticket or guess at work that was never described.

## 2. Resolve the branch name

The tracker owns the name wherever it publishes one:

| Reference | Lookup | Branch name |
| --- | --- | --- |
| Linear (`NX-2867`, `linear.app/…/issue/…`) | Linear MCP `get_issue` | its `gitBranchName`, verbatim |
| GitHub issue (`#123`, `owner/repo#123`, issue URL) | `gh issue view 123 --json number,title` | `123-<title-slug>` |
| Jira (`PROJ-123`, `…atlassian.net/browse/…`) | configured Jira MCP or CLI; with neither, ask the user for the summary line | `PROJ-123-<summary-slug>` |
| Description only | — | `<description-slug>` |

A Linear `gitBranchName` is final: pass it through untouched, prefix included.

Every name you build yourself follows the repo's own convention instead. Read it off the branches that exist:

```bash
git for-each-ref --sort=-committerdate --count=20 --format='%(refname:short)' refs/heads refs/remotes
```

Carry over whatever prefix that shows (`feature/`, `fix/`, a username segment) and match its casing for ticket keys. Slugs are lowercase ASCII, hyphen-separated, truncated at a word boundary so the whole name stays under ~60 characters.

## 3. Create the worktree

`wt` acts on the repo you run it in. Outside a repo it fails, so pass `-C <repo path>` when your shell sits elsewhere, and ask which repo when that is ambiguous.

```bash
wt switch --create <branch> --no-cd --format json -y
```

- The JSON carries `path`: that worktree is where every later command in this task runs.
- `--no-cd` because your shell does not follow the switch; `-y` skips the approval prompt.
- Branch already exists → rerun without `--create`; the JSON comes back as `"action":"existing"`.
- Branching off something other than the default branch → add `--base <branch>`.
- Stale directory at the target path → add `--clobber`.

## 4. Hand back

Report the branch, the worktree path, and the ticket it came from. Then continue the actual implementation inside that worktree.
