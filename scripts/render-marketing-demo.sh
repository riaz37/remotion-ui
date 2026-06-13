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

cat > src/remotion/demo-captions.ts <<'EOF'
import type { Caption } from "@remotion/captions";

export const DEMO_CAPTIONS: Caption[] = [
  { text: " Welcome", startMs: 0, endMs: 400, timestampMs: 0, confidence: 1 },
  { text: " to", startMs: 400, endMs: 600, timestampMs: 400, confidence: 1 },
  { text: " RemotionUI", startMs: 600, endMs: 1200, timestampMs: 600, confidence: 1 },
  { text: " signals", startMs: 1200, endMs: 2000, timestampMs: 1200, confidence: 1 },
];
EOF

cat > src/Root.tsx <<'EOF'
import { Composition } from "remotion";
import { SocialClip } from "@/compositions/social-clip";
import { DEMO_CAPTIONS } from "./remotion/demo-captions";

const SocialClipDemo: React.FC = () => (
  <SocialClip
    hookTitle="Ship videos faster"
    hookSubtitle="Production-ready motion for Remotion"
    audioSrc="https://remotion.media/audio.wav"
    captions={DEMO_CAPTIONS}
    ctaTitle="RemotionUI"
    ctaLabel="remotionui.com"
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
