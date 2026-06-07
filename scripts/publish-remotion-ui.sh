#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG="$ROOT/packages/remotion-ui"

if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.env"
  set +a
fi

if [ -z "${NPM_TOKEN:-}" ]; then
  echo "Error: NPM_TOKEN is not set."
  echo "Copy .env.example to .env and add your npm granular token."
  exit 1
fi

cd "$PKG"
pnpm build
npm publish --access public

echo ""
echo "Published remotion-ui@$(node -p "require('./package.json').version")"
echo "https://www.npmjs.com/package/remotion-ui"
