# Supabase product demo

A 48-second product demo (1920×1080, 30 fps) built with Remotion and RemotionUI. Watch it at [remotionui.com/showcase](https://remotionui.com/showcase).

This is an unofficial concept demo. It was not made by Supabase and is not affiliated with Supabase.

This folder is the full source: camera rig, world layout, cursor, sound cue sheet and screens.

## Assets are not included

The build inputs live in `apps/web/public/supabase-demo/` and are gitignored. That folder holds the dashboard captures of a throwaway demo project, the synthesized score and sound effects, and the logo. A fresh clone can read and study the code, but it can't render the film as-is.

To render it yourself, recreate those assets first:

- **Audio:** `python3 showcase/supabase-demo/scripts/synth.py` (needs `numpy`, `scipy` and `ffmpeg`)
- **Captures:** retake the screenshots listed in `src/captures.ts` from your own demo project, using only test data

Then run `pnpm render:supabase-demo` from `apps/web`.
