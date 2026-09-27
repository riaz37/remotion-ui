# RemotionUI launch film: spec

Source of truth for timing: `src/timeline.ts`. Every number below is copied from it; if they disagree, the file wins and this doc is stale.

## Video spec
- **Goal:** a 34 s launch film for RemotionUI (dev audience, X / site hero / README). It should read as a product film, not a deck or a screen recording. The film proves its own claim: every product surface is either a real capture of remotionui.com or a real registry component rendering live.
- **Format:** 1920×1080, 30 fps.
- **Total:** **1020 frames = 34.0 s**. The composition id is `RemotionUILaunch`, and the render script is `pnpm render:remotionui-launch`, which writes `public/showcases/remotionui-launch.mp4`.
- **Brand:** one world and one accent. The world is `#050505` (BRAND_STAGE) with a static dot grid plus the registry's `animated-noise-grain` at low opacity. The accent is phosphor `#e8b86d` (BRAND_PHOSPHOR). Type is IBM Plex Sans (the site's sans) and JetBrains Mono (the site's mono). The logo is the mark from `public/logo.svg`, redrawn as SVG with the same geometry and colours.
- **Audio:** an original score plus effects, synthesised by `scripts/synth.py` into `public/remotionui-launch/audio/`. The target mean_volume is −14 to −20 dB with no clipping. The last ~1 s is deliberately silent.
- **Beat grid:** 120 BPM = 15 frames per beat, 60 frames per bar.

## Facts (verified from the repo and the live site, none invented)
| Fact | Value | Source |
|---|---|---|
| Component count | **210** | `registry.json`, counted with the `lib/registry-facts.ts` rule (computed at build in `src/facts.ts`). The live site says "Install any of 210 components". README's "206" is stale. |
| Command filmed | `npx remotion-ui@latest add intro` | The live docs page install block (`captures/intro-docs.png`). |
| CLI output | 8 `✓` file lines, `✓ Registered composition "Intro" in Root.tsx`, `Installing dependencies: remotion, @remotion/google-fonts`, `Added 1 component(s) successfully.` | A real run of `packages/remotion-ui/dist/index.js add intro -y` (v0.9.1, the same version npm serves) against a fresh `init my-video` in a temp dir. npm's own install chatter is left out of the film. |
| End CTA | `npx remotion-ui init` | README / CLI help (`init [project-name]`). |
| URL | `remotionui.com` | `lib/site-config.ts` `url`. |
| Tagline | "Source you own, frame by frame." | README line 7. |

## Captures (real browser captures of remotionui.com)
All of them were taken with gstack `browse` at a 1920×1080 CSS viewport and device scale 2, so each PNG is 3840×2160. Before each shot the promo banner and the Kine early-access popup were dismissed and fixed overlays were hidden. Every rect was read with `getBoundingClientRect` in the same session and stored in `src/captures.ts`, with the raw JSON next to the PNGs. Privacy check: no avatars and no emails. The only live number shown is the public GitHub star count.

| Capture | Used in |
|---|---|
| `home-hero-copy.png` (header, headline, handwritten "for Remotion.", subcopy, init command box and Browse components; taken at scrollY 0 with the monitor hidden) | B2 hero beat. It is the copy layer only. Behind it the film renders the homepage's **real light field**, the site's own `PhosphorField` WebGL2 shaders (`world/PhosphorField.tsx`, imported from `components/landing/phosphor-field-shaders.ts`). The `.phosphor-mask` CSS, the canvas geometry (1920×1023 at pixel ratio 0.9573) and the page colour rgb(6,6,5) are all copied from the site. The monitor rect plays the repo's own `hero-loop` live, transparent, so the field runs through it as on the site. |
| `live-reference/live-hero-{1..4}.png` | QA reference only: the live hero shot 1.5 s apart in the **headed** gstack browser (1920×1080 at 1×, because headed mode is locked to the window's DPR). This is the only mode with WebGL2, so the only one where the field is visible. |
| `intro-docs.png` / `intro-docs-copied.png` (the `intro` docs page: Install block with Copy button, live Player) | B3. The Copy button is clicked, then a 3-frame crossfade to the real "Copied" state. The Player rect is filled by the live `Intro` composition with the same props the docs page uses ("Frame registry"). |
| `gallery.png` (/docs/components/browse, "210 installable components …", lane tabs, tile rows) | B5 reveal. It rises in the foreground in front of the component wall; its sidebar logo is the push target into the end card. |
| `cli-docs.png` | Captured for reference and not used; the cut would not fit 34 s. |

The captures are shot as physical objects: tilted planes (5–10°), macro pushes, and far layers blurred. Camera scale on a capture is never above 2.0, which is the capture's native resolution.

## Scene list
| # | Name | Frames | Content & motion | Source |
|---|---|---|---|---|
| B1 | Thesis | 0–135 | f0 is composed: the dot-grid world and "Motion design" already set. "takes a week." lands word by word, and "week." decodes out of code glyphs to land on f30. Hold ~1 s, exit 54–64. "It should take a command." then lands word by word; "command." decodes and its full stop lands on **f90** (beat 6). Hold 1.27 s to the push at 128. | Custom kinetic type (`DecodeWord`, deterministic `random(seed)`) |
| B2 | Hero | 128–255 | **Push** 128–160: the type flies past camera while the hero capture plane arrives out of depth. **Macro push across the headline** 160–200 at s≈1.7, panning left to right over "Production-ready motion", then a **settle** 200–228 on the whole hero at s≈0.9. `hero-loop` plays live in the Player rect. The cursor enters at 212, clicks **Browse components** at 240, and a travel follows. | Capture + registry `hero-loop` + registry `simulated-cursor` |
| B3 | The command | 242–470 | Travel 242–272 to the `intro` docs page, settling on the Install block and live Player. The cursor moves to Copy and clicks at **295**; the real "Copied" state follows at 297. **Push** 300–330 into the command line; a terminal window grows out of that line (318–350). The real command types, and the real CLI output streams (registry `terminal-simulator`, speed 1.25). As each file line prints, a card carrying that file's real source flies out into a 3D **fan of 8 cards**. Travel to the fan 410–440. The `compositions/intro/index.tsx` card comes forward 438–452 and **flips** 452–470. | Capture + registry `terminal-simulator`, `intro` (live), `code-syntax` lib + custom file cards |
| B4 | Montage | 470–720 | 470–540: the flipped card *is* the rendered `Intro`, playing live (payoff). **540–720: accelerating match-cut** through 17 real components inside one fixed rounded card (1440×810, same position). Cut lengths in 16th notes: 5,4,4,4,3,3,3,3,3,2,2,2,2,2,2,2,2 (0.63 s → 0.25 s), locked to the music build. A mono slug label under the card names each one. | 17 registry components (list below) |
| B5 | Reveal | 720–900 | **Hard stop on the downbeat f720** (bar 12): picture freezes and the music cuts. **Pull back** 724–790: the card becomes one tile in a wall of all 210 real component posters, on a tilted plane with the far tiles out of focus. A count-up 732→780 lands on "210" on the beat, followed by "This film is made of them." (795–840). The real gallery page rises into the foreground 835–868 (focus pull), with a ring on its "210 installable components" line. **Push** 868–900 into the gallery's sidebar logo. | registry `counter` + wall of real posters + gallery capture |
| B6 | End card | 900–1020 | Logo mark lands on the impact at **f900**, with the "RemotionUI" wordmark. "Source you own, frame by frame." follows at 910, then `npx remotion-ui init` types from 920, then `remotionui.com` at 936. Content is complete by ~950 and held still to 1020. The music ends by 990, so **990–1020 is silent**. | Custom lockup (mark from `public/logo.svg`) + registry `typewriter` |

Every transition is a camera move or a morph: push (B1→B2, B3 command→terminal), travel (B2→B3, terminal→fan), flip (fan→montage), pull (montage→wall), push (gallery→end card). The only hard cuts are inside the montage.

### Why the hero beat sits right after the thesis
The thesis poses a problem ("Motion design takes a week. It should take a command."), and the homepage headline answers it by naming the product ("Production-ready motion for Remotion."). Putting it there turns the cold open into a question/answer pair and establishes the brand before the demo. It also hands off naturally: the CTA that leads into the next beat is **Browse components**, which is the path to a component page. The alternative, the hero as lead-in to the reveal, would stack two brand moments (hero, then end card) back to back after the montage and blunt the hard stop. The hero's init command box is kept for the end card, where `npx remotion-ui init` is the CTA.

## Montage: registry components used, and why each earns its slot
Order and cut length (16ths). Every one is imported from `apps/web/registry/bases/default/` and renders live, at a local frame offset chosen so it is mid-motion in its slot (checked against each component's own timing).

| # | Component | Lane | 16ths | Why |
|---|---|---|---|---|
| 1 | `text-extrude-3d` | 3D | 5 | Opens on the heaviest proof (WebGL, @remotion/three) and gets the longest look. |
| 2 | `code-reveal` | Code & terminal | 4 | Code scenes are core to a dev audience. |
| 3 | `donut-chart` | Charts | 4 | Data lane, animated arcs in the phosphor palette. |
| 4 | `aurora-bg` | Backgrounds | 4 | A full-frame background, a change of texture. |
| 5 | `globe-points-3d` | 3D | 3 | Real Natural Earth land dots, a second 3D look. |
| 6 | `grid-pixelate-wipe` | Transitions | 3 | A real `TransitionSeries` presentation caught mid-wipe. |
| 7 | `matrix-decode` | Text effects | 3 | Rhymes with the film's glyph decode. |
| 8 | `light-tunnel-bg` | Shaders | 3 | GPU shader lane. |
| 9 | `speaker-label-captions` | Captions | 3 | Captions lane (deliberately not one of the caption files another session is editing). |
| 10 | `radar-chart` | Charts | 2 | Data, different geometry. |
| 11 | `card-stack-3d` | 3D | 2 | Third 3D look. |
| 12 | `handwriting-text` | Text effects | 2 | Rhymes with the homepage's handwritten "for Remotion." |
| 13 | `warp-bands-bg` | Shaders | 2 | Shader texture flash. |
| 14 | `waveform-bars-radial` | Audio | 2 | Audio lane (reads the repo's demo loop; the audio itself is not played). |
| 15 | `gauge-dial` | Charts | 2 | Fast data hit. |
| 16 | `liquid-text-morph` | Text effects | 2 | Caught mid-morph. |
| 17 | `logo-reveal` | Paths & logo | 2 | The RemotionUI mark drawing itself. This is the frame that freezes on the hard stop and is pushed back into for the end card. |

Other registry pieces in the film: `hero-loop` (B2), `simulated-cursor` (B2/B3), `terminal-simulator` (B3), `intro` (B3/B4), `counter` (B5), `typewriter` (B6), `animated-noise-grain` (world), and the `code-syntax` lib (file cards).

The **wall** uses the real 640×360 posters from `public/previews/` for 190 components. The 20 with no poster (listed in `src/facts.ts`) were rendered to `public/remotionui-launch/tiles/` from their docs preview wrappers by the `LaunchTile` composition.

## Camera
One world, one camera (`src/camera/`, adapted from the supabase-demo rig). Scale is interpolated in log space with a spring settle, and travel moves dip out and back in. Motion blur is analytic, taken from the camera velocity, using the `userSpaceOnUse` 1920×1080 filter-region fix. Planes carry their own 5–10° tilt. Depth of field is a blurred copy of the far layers behind a sharp, radially masked copy.

## Sound (every cue is derived from `timeline.ts`)
- **Score:** a sparse pad under B1. The kick enters with the hero push (128), and bass plus hats come in at B3. The lift at the flip (452) gives way to the build across the montage (540–720): 16th hats, a clap roll accelerating with the cuts, and a riser. At the f720 hard stop everything cuts except a sub drop and a reverb tail. A quiet filtered pad returns under the count. A riser into the f900 impact, then the final chord, which fades out by 990.
- **Effects:** a tick per thesis word, glitch ticks on each decode, whooshes peaking on move peaks (128–160, 242–272, 300–330, 410–440), a click on each cursor press (240, 295), typing ticks, a tick per CLI line, a card-flip whoosh, **a pop per montage cut**, a hit at 720, count-up ticks, and an impact at 900.
- **Ducking:** music is ducked 6 dB under effect clusters (the `cues.ts` approach).

### Hero background correction (owner feedback)
The first cut's hero had a flat black background. The live hero's background is `PhosphorField`: a WebGL2, time-animated amber halftone fan, masked around the copy. The headless capture browser has no WebGL2 (`getContext("webgl2")` returns null and the canvas stays at 300×150), so the site fell back to a blank canvas and every headless capture missed the field. On top of that, the old capture was taken at scrollY 62, which moves the hero's scroll progress off 0, and the film drew an opaque page-coloured box behind the Player. The fix renders the site's own shaders frame-accurately, recaptures the copy layer at scrollY 0 with the monitor hidden, and makes the Player rect transparent. `LaunchHeroCheck` (QA only) renders the hero plane head-on at 1:1 for side-by-side comparison with the live capture.

## Proof checklist (to be run before calling it done)
- `ffprobe -count_frames` → 1020.
- `volumedetect` mean between −14 and −20 dB, max < 0 dB.
- Stills: f0, beat midpoints (60, 190, 360, 505, 630, 810, 960), move peaks (144, 180, 257, 315, 425, 461, 757, 884), montage cuts, the f720 hard stop, f780 count, f860 gallery, f905 impact, f1019.

## Verification (2026-09-27, final render)
- `pnpm render:remotionui-launch` exits 0 and writes `public/showcases/remotionui-launch.mp4`: h264, 1920×1080, 30 fps, 16 MB (re-rendered after the hero background fix).
- `ffprobe -count_frames`: **1020** frames (34.0 s).
- `volumedetect` over the whole film: **mean −18.6 dB, max −3.4 dB**. By section: thesis −24.2 (a deliberately quiet cold open), build before the f720 stop −15.7, after the stop −16.9, end card −14.3, and 33.1–34.0 s is **−91 dB (digital silence)**.
- Stills read (half scale unless noted): f0, 30, 60, 105, 140, 150, 180, 200, 228, 238, 257, 285, 297, 315, 330, 345, 360, 385, 405, 425, 440, 452, 461, 475, 505, the midpoint of every montage cut (549 … 716), 719, 720, 740, 757, 780, 800, 815, 845, 850, 860, 866, 872, 884, 890, 894, 896, 898, 899, 903, 905, 920, 950 and 1019. f882 and f886 were also checked at full resolution to confirm the mark takeover seam. Frames 0, 90, 190, 297, 380, 505, 600, 720, 780, 815, 860, 950 and 1019 were extracted from the MP4 and match.
- Hero vs live site: `LaunchHeroCheck` stills (f160/190/228) compared with four headed live captures. Region colour means match to within one level, and the film's mean pixel difference from the live captures (1.1–3.5 levels) is within the live page's own frame-to-frame variation (1.7–3.7). Side-by-sides are in the session scratchpad `live/side-by-side-*.jpg`.
- Fixes made from the stills: the thesis overlapped the hero push; the terminal was framed too small to read; fan cards drew over the flipping card; `logo-reveal` flooded into a solid square (see open items); `card-stack-3d` and `globe-points-3d` were off-palette; the radar and captions were too small; the gallery was unreadable at 0.6×; the mark and the gallery logo were misaligned while the page was still tilted.

## Open items
- **Registry defect: `logo-reveal`.** Its default `strokeWidth` is computed in pixels (`markSize * 0.022`) but PathDraw applies it in viewBox units. Any mark with a small viewBox (the RemotionUI mark is 32 units) floods into a solid block. The film passes `strokeWidth={0.7}`; the registry default should be fixed separately.
- `text-extrude-3d` keeps a blue-grey floor pool even with a warm `glowColor`, because the scene exposes no floor colour prop. It is a minor break from the single-accent rule in one 0.63 s cut.
- The wall uses the real posters as shipped, and some of them are multi-colour (the card-stack, light-tunnel and globe posters). That is honest to the registry, but not single-accent.
- The Remotion version-mismatch warning (zod 4.6.5 vs 4.5.4, @remotion/effects 4.0.524) is the repo's existing environment and was left alone.
- README still says 206 components; the film states the computed 210 (as the live site does).
