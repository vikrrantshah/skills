#!/usr/bin/env bash
# Symlink every skill in this repo into each agent's skills directory.
#   ~/.claude/skills  Claude Code
#   ~/.agents/skills  omp (its `agents` provider; the Claude user provider is off by default)
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
read -ra dests <<<"${SKILLS_DIRS:-$HOME/.claude/skills $HOME/.agents/skills}"

for dest in "${dests[@]}"; do
  mkdir -p "$dest"
  for skill in "$repo"/*/; do
    [ -f "$skill/SKILL.md" ] || continue
    name="$(basename "$skill")"
    link="$dest/$name"

    if [ -L "$link" ]; then
      ln -sfn "${skill%/}" "$link"
      echo "relinked $name -> $dest"
    elif [ -e "$link" ]; then
      echo "skipped  $name (real directory at $link)"
    else
      ln -s "${skill%/}" "$link"
      echo "linked   $name -> $dest"
    fi
  done
done
