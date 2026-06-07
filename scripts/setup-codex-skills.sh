#!/usr/bin/env bash
# Link repo skills into .agents/skills/ for Codex discovery.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CODEX_SKILLS_DIR="$ROOT_DIR/.agents/skills"

link_skill() {
  local name="$1"
  local source="$ROOT_DIR/skills/$name"
  local target="$CODEX_SKILLS_DIR/$name"

  if [ ! -d "$source" ]; then
    echo "Error: skills/$name/ not found. Run sync-remotion-skills.sh first." >&2
    exit 1
  fi

  mkdir -p "$CODEX_SKILLS_DIR"

  if [ -L "$target" ]; then
    rm "$target"
  elif [ -d "$target" ]; then
    rm -rf "$target"
  fi

  ln -s "../../skills/$name" "$target"
  echo "Linked skills/$name/ -> .agents/skills/$name/"
}

link_skill "remotion"
link_skill "remotion-ui"

echo "Codex skills ready at .agents/skills/"
