#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG="$ROOT/packages/remotion-ui"
PKG_JSON="$PKG/package.json"

echo "==> RemotionUI publish prep"
echo ""

step() {
  echo "── $1"
}

fail() {
  echo "error: $1" >&2
  exit 1
}

step "Check CHANGELOG has notes for package version"
VERSION="$(node -p "require('$PKG_JSON').version")"
if ! awk -v ver="$VERSION" '
  /^## / { if ($2 == ver) found=1 }
  END { exit found ? 0 : 1 }
' "$ROOT/CHANGELOG.md"; then
  fail "CHANGELOG.md is missing a ## $VERSION section"
fi
echo "    version $VERSION documented"

step "Lint monorepo"
(cd "$ROOT" && pnpm lint)

step "Build registry + docs"
(cd "$ROOT" && pnpm registry:build)
(cd "$ROOT" && pnpm --filter web build)

step "Test CLI"
(cd "$ROOT" && pnpm --filter remotion-ui test)

step "Build CLI package"
(cd "$PKG" && pnpm build)

step "Verify CLI --version matches package.json"
BUILT_VERSION="$(node "$PKG/dist/index.js" --version)"
if [ "$BUILT_VERSION" != "$VERSION" ]; then
  fail "dist reports $BUILT_VERSION but package.json is $VERSION"
fi
echo "    remotion-ui --version => $BUILT_VERSION"

step "Count hosted registry items (local build)"
ITEM_COUNT="$(node -p "require('$ROOT/apps/web/public/r/index.json').items.length")"
echo "    public/r/index.json => $ITEM_COUNT items"
if [ "$ITEM_COUNT" -lt 100 ]; then
  fail "expected at least 100 registry items before publish (got $ITEM_COUNT)"
fi

step "npm publish dry run"
(cd "$PKG" && npm publish --access public --dry-run)

echo ""
echo "Publish prep passed for remotion-ui@$VERSION"
echo ""
echo "Release order:"
echo "  1. Merge to main and deploy remotionui.com (registry must be live first)"
echo "  2. Tag: git tag v$VERSION && git push origin v$VERSION"
echo "  3. Publish CLI:"
echo "       pnpm publish:cli"
echo "     or GitHub Actions → Publish CLI (dry_run=false)"
echo "  4. Smoke test:"
echo "       npx remotion-ui@latest --version"
echo "       npx remotion-ui@latest search -q claude-chat"
