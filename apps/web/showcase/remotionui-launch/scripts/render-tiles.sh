#!/bin/zsh
# render-tiles.sh: stills of the docs preview for each component that has no
# poster in public/previews, for the reveal wall. Run from apps/web.
#   zsh showcase/remotionui-launch/scripts/render-tiles.sh
set -e
OUT=public/remotionui-launch/tiles
mkdir -p $OUT
SLUGS=(blur-focus-in staggered-fade-up masked-slide-reveal tracking-in light-sweep-text slot-roll matrix-decode
  rgb-glitch-text infinite-marquee perspective-marquee strikethrough-replace light-tunnel-bg text-reveal-shader
  dither-field-bg warp-bands-bg grain-gradient-bg product-turntable-3d text-extrude-3d card-stack-3d globe-points-3d)
# Frame 60 of the preview window: past every entrance, before any exit.
for slug in $SLUGS; do
  npx remotion still showcase/remotionui-launch/src/index.ts LaunchTile $OUT/$slug.jpg \
    --props="{\"slug\":\"$slug\"}" --frame=60 --image-format=jpeg --jpeg-quality=88 --gl=angle --log=error
  echo "tile $slug"
done
