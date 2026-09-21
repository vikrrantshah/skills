#!/usr/bin/env bash
# Symlink every skill in this repo into ~/.claude/skills.
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
dest="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
mkdir -p "$dest"

for skill in "$repo"/*/; do
  [ -f "$skill/SKILL.md" ] || continue
  name="$(basename "$skill")"
  link="$dest/$name"

  if [ -L "$link" ]; then
    ln -sfn "${skill%/}" "$link"
    echo "relinked $name"
  elif [ -e "$link" ]; then
    echo "skipped  $name (real directory at $link)"
  else
    ln -s "${skill%/}" "$link"
    echo "linked   $name"
  fi
done
