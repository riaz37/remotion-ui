#!/usr/bin/env bash
# Sync official Remotion Agent Skills from remotion-dev/remotion into skills/remotion/
set -euo pipefail

REPO="https://github.com/remotion-dev/remotion.git"
SRC_PATH="packages/skills/skills/remotion"
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

rm -rf "$DEST_DIR"
mkdir -p "$DEST_DIR"
cp -R "$SRC_PATH/." "$DEST_DIR/"

cat > "$DEST_DIR/VERSION" <<EOF
upstream: remotion-dev/remotion
commit: $COMMIT
date: $COMMIT_DATE
path: $SRC_PATH
docs: https://www.remotion.dev/docs/ai/skills
EOF

FILE_COUNT="$(find "$DEST_DIR" -type f ! -name VERSION | wc -l | tr -d ' ')"
echo "Synced $FILE_COUNT files to skills/remotion/ (commit: ${COMMIT:0:7})"
