# RemotionUI launch film

A 34-second product film (1920×1080, 30 fps) built with Remotion and RemotionUI components. Watch it at [remotionui.com/showcase](https://remotionui.com/showcase).

This folder is the full source: camera rig, timeline, sound cue sheet and scenes.

## Assets are not included

The build inputs live in `apps/web/public/remotionui-launch/` and are gitignored. That folder holds the browser captures of remotionui.com, the synthesized score and sound effects, and the component tiles. A fresh clone can read and study the code, but it can't render the film as-is.

To render it yourself, recreate those assets first:

- **Audio:** `python3 showcase/remotionui-launch/scripts/synth.py` (needs `numpy`, `scipy` and `ffmpeg`)
- **Tiles:** `zsh showcase/remotionui-launch/scripts/render-tiles.sh`
- **Captures:** retake the screenshots listed in `src/captures.ts` at a 1920×1080 viewport and 2× scale

Then run `pnpm render:remotionui-launch` from `apps/web`.
