---
name: create-worktree
description: Create a branch and its git worktree with the `wt` CLI, from a ticket or a description.
disable-model-invocation: true
---

# Create Worktree

Turn a piece of work into a branch name, then let `wt` create the worktree for it.

## 1. Pin the work item

You need exactly one of: a tracker reference (ticket key, issue number, or URL) or a description concrete enough to name a branch.

Take it from the user's message or from what the conversation already established. If neither carries one, **ask the user and stop** until they answer. Never invent a ticket or guess at work that was never described.

## 2. Resolve the branch name

Fetch the ticket with whatever tracker tooling this environment has, MCP or CLI. Where the tracker publishes a branch name for that ticket (Linear's `gitBranchName`, say), it wins verbatim, prefix included. Otherwise the name is `<ticket-key>-<title-slug>`, or `<description-slug>` when there is no ticket.

Names you build match the repo's convention, read off the branches that exist:

```bash
git for-each-ref --sort=-committerdate --count=20 --format='%(refname:short)' refs/heads refs/remotes
```

Carry over the prefix they show (`feature/`, `fix/`, a username segment). Slugs are lowercase ASCII, hyphen-separated, cut at a word boundary to keep the whole name under ~60 characters.

No tooling reaches the tracker → ask the user for the ticket's title and build the name from that.

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

The skill ends at the worktree. Report the branch, its path, and the ticket it came from, then stop and take the user's next instruction — research, a plan, or implementation, their call.
