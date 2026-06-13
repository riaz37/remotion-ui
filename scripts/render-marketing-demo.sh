#!/usr/bin/env bash
# Render social-clip demo MP4 for Twitter / Discord #showcase.
# Requires: pnpm registry:build && pnpm --filter remotion-ui build
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/marketing/social-clip-demo.mp4"
NAME="marketing-demo-$$"
PROJECT="$ROOT/tmp/$NAME"
CLI="node $ROOT/packages/remotion-ui/dist/index.js"
REGISTRY="$ROOT/apps/web/public/r"

cleanup() { rm -rf "$PROJECT"; }
trap cleanup EXIT

export REMOTION_UI_REGISTRY_URL="$REGISTRY"

echo "→ init tmp/$NAME"
(cd "$ROOT" && $CLI init "tmp/$NAME")

cd "$PROJECT"

echo "→ add social-clip"
$CLI add social-clip

mkdir -p public
cp "$ROOT/apps/web/public/logo.svg" public/logo.svg

cat > src/remotion/demo-captions.ts <<'EOF'
import type { Caption } from "@remotion/captions";

export const DEMO_CAPTIONS: Caption[] = [
  { text: " Install", startMs: 0, endMs: 360, timestampMs: 0, confidence: 1 },
  { text: " components", startMs: 360, endMs: 780, timestampMs: 360, confidence: 1 },
  { text: " as", startMs: 780, endMs: 980, timestampMs: 780, confidence: 1 },
  { text: " source", startMs: 980, endMs: 1800, timestampMs: 980, confidence: 1 },
];
EOF

cat > src/Root.tsx <<'EOF'
import { Composition, staticFile } from "remotion";
import { SocialClip } from "@/compositions/social-clip";
import { DEMO_CAPTIONS } from "./remotion/demo-captions";

const LOGO = staticFile("logo.svg");

const SocialClipDemo: React.FC = () => (
  <SocialClip
    logoSrc={LOGO}
    hookTitle="Production-ready motion"
    hookSubtitle="for Remotion. Source you own."
    audioSrc="https://remotion.media/audio.wav"
    captions={DEMO_CAPTIONS}
    podcastTitle="RemotionUI"
    ctaTitle="RemotionUI"
    ctaLabel="npx remotion-ui add"
    ctaUrl="remotionui.com"
  />
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="SocialClipDemo"
      component={SocialClipDemo}
      durationInFrames={228}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
EOF

mkdir -p "$(dirname "$OUT")"
echo "→ render → $OUT"
npx remotion render src/index.ts SocialClipDemo "$OUT" --scale=0.5

echo "✓ Demo video: $OUT"
