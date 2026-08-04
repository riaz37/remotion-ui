#!/usr/bin/env bash
# Link repo skills into .agents/skills/ (Codex) and .claude/skills/ (Claude Code).
#
# Upstream Remotion skills live in skills/remotion/<skill-name>/.
# RemotionUI-authored skills live in skills/<skill-name>/.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CODEX_SKILLS_DIR="$ROOT_DIR/.agents/skills"
CLAUDE_SKILLS_DIR="$ROOT_DIR/.claude/skills"

mkdir -p "$CODEX_SKILLS_DIR" "$CLAUDE_SKILLS_DIR"

# link_skill <skill-name> <path-relative-to-repo-root>
link_skill() {
  local name="$1"
  local rel="$2"
  local source="$ROOT_DIR/$rel"

  if [ ! -d "$source" ]; then
    echo "Error: $rel/ not found. Run sync-remotion-skills.sh first." >&2
    exit 1
  fi

  for dir in "$CODEX_SKILLS_DIR" "$CLAUDE_SKILLS_DIR"; do
    local target="$dir/$name"
    if [ -L "$target" ]; then
      rm "$target"
    elif [ -d "$target" ]; then
      rm -rf "$target"
    fi
    ln -s "../../$rel" "$target"
  done

  echo "Linked $rel/ -> .agents/skills/$name/, .claude/skills/$name/"
}

# Prune stale links (e.g. the pre-4.0 monolithic "remotion" skill).
for dir in "$CODEX_SKILLS_DIR" "$CLAUDE_SKILLS_DIR"; do
  find "$dir" -maxdepth 1 -mindepth 1 -type l -delete
done

for skill_md in "$ROOT_DIR"/skills/remotion/*/SKILL.md; do
  [ -e "$skill_md" ] || continue
  skill_dir="$(dirname "$skill_md")"
  link_skill "$(basename "$skill_dir")" "skills/remotion/$(basename "$skill_dir")"
done

link_skill "remotion-ui" "skills/remotion-ui"
link_skill "remotionui-agent" "skills/remotionui-agent"

echo "Agent skills ready at .agents/skills/ and .claude/skills/"
