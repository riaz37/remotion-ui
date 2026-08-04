#!/usr/bin/env bash
# Sync official Remotion Agent Skills from remotion-dev/remotion into skills/remotion/
#
# Upstream ships a set of focused skills (remotion-best-practices, remotion-markup,
# remotion-captions, ...). Each becomes skills/remotion/<skill-name>/.
# The RemotionUI-maintained docs mirror at skills/remotion/docs/ is preserved.
set -euo pipefail

REPO="https://github.com/remotion-dev/remotion.git"
SRC_PATH="packages/skills/skills"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEST_DIR="$ROOT_DIR/skills/remotion"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "Syncing Remotion skills from $REPO..."

git clone --depth 1 --filter=blob:none --sparse "$REPO" "$TMP_DIR/repo" 2>/dev/null
cd "$TMP_DIR/repo"
git sparse-checkout set "$SRC_PATH" 2>/dev/null

COMMIT="$(git rev-parse HEAD)"
COMMIT_DATE="$(git log -1 --format=%ci)"

if [ ! -d "$SRC_PATH" ]; then
  echo "Error: $SRC_PATH not found in remotion repo" >&2
  exit 1
fi

SKILL_DIRS=()
while IFS= read -r skill_md; do
  SKILL_DIRS+=("$(basename "$(dirname "$skill_md")")")
done < <(find "$SRC_PATH" -mindepth 2 -maxdepth 2 -name SKILL.md | sort)

if [ "${#SKILL_DIRS[@]}" -eq 0 ]; then
  echo "Error: no SKILL.md found under $SRC_PATH" >&2
  exit 1
fi

DOCS_BACKUP="$TMP_DIR/docs-backup"
if [ -d "$DEST_DIR/docs" ]; then
  cp -R "$DEST_DIR/docs" "$DOCS_BACKUP"
fi

rm -rf "$DEST_DIR"
mkdir -p "$DEST_DIR"

for name in "${SKILL_DIRS[@]}"; do
  cp -R "$SRC_PATH/$name" "$DEST_DIR/$name"
  echo "  + $name"
done

if [ -d "$DOCS_BACKUP" ]; then
  cp -R "$DOCS_BACKUP" "$DEST_DIR/docs"
fi

{
  echo "upstream: remotion-dev/remotion"
  echo "commit: $COMMIT"
  echo "date: $COMMIT_DATE"
  echo "path: $SRC_PATH"
  echo "docs: https://www.remotion.dev/docs/ai/skills"
  echo "skills: ${SKILL_DIRS[*]}"
} > "$DEST_DIR/VERSION"

FILE_COUNT="$(find "$DEST_DIR" -type f ! -name VERSION | wc -l | tr -d ' ')"
echo "Synced ${#SKILL_DIRS[@]} skills / $FILE_COUNT files to skills/remotion/ (commit: ${COMMIT:0:7})"
