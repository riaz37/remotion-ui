# RemotionUI launch film: master prompt

## Mission
Make a world-class launch film for RemotionUI, the copy-paste component registry for Remotion video projects. The bar is the best dev-tool launches on whatships.com (Linear Loops, Railway Sandboxes, Framer Skills, Claude Opus 5.5). It must not look like a deck or a screen recording.

The film is its own proof: **every frame is built from RemotionUI components.** The final reveal says so.

## Deliverable
- **Folder:** `apps/web/showcase/remotionui-launch/` (showcase, NOT registry, so never add it to `registry.json`).
- **Render script:** `render:remotionui-launch` in `apps/web/package.json`, which writes `public/showcases/remotionui-launch.mp4`.
- **Format:** 1920×1080, 30 fps, **30–36 s**. The best dev-tool launches were 20–40 s; past 45 s they become walkthroughs.
- **Existing work:** read `showcase/launch-film/`, `showcase/promo/`, `showcase/supabase-demo/` first.
  - Reuse proven pieces: the supabase-demo camera rig (`camera/rig.ts`, log-space zoom, spring settle), the analytic `MotionBlur` (with the `userSpaceOnUse` 1920×1080 filter-region fix), the frame-locked cue sheet plus ducking, and the `scripts/synth.py` score approach.
  - Import real registry components from `apps/web/registry/bases/default/`. Don't redraw them.
- **Real site captures (owner addition):** every shot of remotionui.com is a real browser capture, never a drawn recreation.
  - Capture with gstack `/browse` at a 1920×1080 CSS viewport and device scale 2 (3840×2160 PNGs), into `public/remotionui-launch/captures/`.
  - Dismiss banners and popups and hide any overlay first. Check for anything personal.
  - Record every cursor and zoom target with `getBoundingClientRect` in the same session, into `src/captures.ts`. Never eyeball.
  - Shoot captures as physical objects: tilted plane, macro push, depth of field. Never zoom past 2× capture resolution.
  - Beat 3 uses the component docs page: the cursor clicks Copy on the real `npx remotion-ui@latest add …` block, then the camera pushes into the terminal.
  - The reveal pairs the real gallery page with the component wall.

## Facts: verify everything from the repo, invent nothing
- **Component count:** count it from `registry.json` (it was 206 at last check).
- **Lanes/categories:** take them from the registry.
- **CLI:** get the exact commands and output (`init`, `add <name>`) by running the CLI from `packages/` against a temp project, and film that real output.
- **Links:** use the real domain and GitHub URL from the README and site config.

## Craft rules (from the whatships study)
1. **No hard cuts except inside one montage.** Every beat change is a camera move or a morph: push, tilt, pull, or a small window that grows into the next scene.
2. **One background, one accent for the whole film.** Pick from the RemotionUI brand (site theme). Use a near-black, dot-grid or subtle grain world, with type in one sans plus one mono.
3. **Kinetic type:** one word or short phrase per beat, big and centred, with the full stop landing on the beat. Hold each for 1–2 s.
4. **Brand-native transition:** words decode through code glyphs (`Comp0nen+s` becomes `Components.`), deterministic via `random(seed)`.
5. **Real components shot like physical objects:** tilted 3D plane (5–10°), macro push, shallow depth of field via blur on the far layers. Never show a dense surface whole at unreadable size.
6. **Typed input as the narration:** a caret in a real terminal. No voiceover.
7. **One accelerating montage:** match-cut many real components inside one fixed frame shape (the same rounded card, same position). Cuts shrink from about 0.6 s to about 0.25 s, locked to a music build.
8. **Payoff shot, not a feature list:** end the demo with a finished, beautiful render. It should not stop at the code.
9. **End card ≤ 3 s of content, plus about 1 s of deliberate silent tail:** logo, one line, the CLI command as the CTA, and the URL.
10. **No decorative accent bars or rules above headings** (strict owner rule). Frame 0 must be a composed image.

## Beat sheet (a starting point; tighten it in your spec)
The beat grid is 120 BPM = 15 frames per beat.
| # | Time | Beat |
|---|---|---|
| 1 | 0–4.5 s | **Thesis cold open.** Two lines of kinetic type, e.g. "Motion design takes a week." / "It should take a command." The last word decodes into code glyphs. |
| 2 | 4.3–8.5 s | **Homepage hero (owner addition).** The real 2× capture of the remotionui.com hero, with its Player filled by the live `hero-loop` composition. A slow macro push across the headline (it must be readable), then a settle on the whole hero. The cursor clicks the CTA that leads into the next beat (Browse components). It sits right after the thesis because the headline answers it; see SPEC.md. |
| 3 | 8–15.7 s | **The command.** The real `intro` docs page: the cursor clicks Copy on `npx remotion-ui@latest add intro` and the "Copied" state lands. The camera pushes into a terminal that grows out of that line. The command types and the real CLI output streams. Source files land as a fan of cards: it's your code, not a dependency. |
| 4 | 15.7–24 s | **The montage.** One file card flips into the rendered component playing live, then the accelerating match-cut through the real registry: text and captions, transitions, charts and data, code scenes, 3D lane, backgrounds and shaders. One fixed card shape, locked to the build. |
| 5 | 24–30 s | **The reveal.** Hard stop on the downbeat. Pull back: the montage cards are tiles in a wall of the whole registry, with a count-up to the real component count. Line: "This film is made of them." The real gallery page rises in front of the wall. |
| 6 | 30–34 s | **End card.** Logo on the impact, one tagline, `npx remotion-ui init`, and the URL. Readable hold, then about 1 s of silence. |

## Sound
- **Score:** original, synthesised in the repo like supabase-demo's `synth.py`, with a build that peaks at the montage and a clean stop for the reveal.
- **Effects:** every cue is frame-locked to the timeline constants: typing ticks, whooshes peaking on move peaks, a pop per montage cut, and an impact on the logo. Duck the music under effect clusters.
- **Target:** mean_volume −14 to −20 dB, no clipping.

## Process (spec first)
1. Write `SPEC.md` in the folder: a scene-by-scene spec with frames, camera moves and cues, plus the list of registry components used and why each earns its slot. Verify Remotion APIs against the current docs.
2. Build.
3. Prove it before you call it done:
   - `ffprobe -count_frames` matches the intended duration.
   - `volumedetect` is in range.
   - Read stills at frame 0, every beat midpoint, every move peak, montage cuts, the reveal and the last frame.
   - Nothing unreadable, no overlap, no frozen or dead components (every component actually animates in its slot), no seams.
4. Known traps:
   - The render script's `--registry` flag renders only 90 frames, so always pass the duration explicitly.
   - Components have preview timing assumptions, so check each one's real duration so it isn't frozen at its tail.
   - `measureText` must run after fonts load.
   - `@remotion/three` components need their determinism contract.

## Guardrails
- Do not commit or push. Do not touch uncommitted caption files elsewhere in the repo (another session's work), `registry.json`, or the supabase-demo.
- Stay on the current branch.
- Report back: what was built, render stats, QA still paths, and open defects.
