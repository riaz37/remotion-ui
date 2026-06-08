#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG="$ROOT/packages/remotion-ui"

if [ -f "$ROOT/.env" ]; then
  echo "Warning: loading NPM_TOKEN from .env is a legacy fallback."
  echo "Prefer GitHub Actions Trusted Publishing with npm OIDC for releases."
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.env"
  set +a
fi

if [ -z "${NPM_TOKEN:-}" ]; then
  echo "NPM_TOKEN is not set; using the current npm CLI authentication."
  echo "Prefer GitHub Actions Trusted Publishing for regular releases."
else
  export NODE_AUTH_TOKEN="${NODE_AUTH_TOKEN:-$NPM_TOKEN}"
fi

cd "$PKG"
pnpm build
npm publish --access public

echo ""
echo "Published remotion-ui@$(node -p "require('./package.json').version")"
echo "https://www.npmjs.com/package/remotion-ui"
