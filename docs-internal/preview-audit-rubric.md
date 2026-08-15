# Preview audit rubric

Every registry component ships a preview wrapper in `apps/web/components/previews/`.
Those wrappers are rendered in two places with very different constraints:

- **Tile** — the landing page contact sheet and the atlas grid, roughly 308 px wide.
- **Doc page** — the component reference page, roughly 800 px wide.

The audit judges each preview at both sizes against the criteria below. Evidence is
rendered stills, not browser screenshots: the docs `<Player>` stays paused at frame 0
in headless Chromium, so screenshots show every component at opacity 0.

```
pnpm --filter web audit:stills --out /tmp/stills --scale 0.5
pnpm --filter web audit:montage --stills /tmp/stills --out /tmp/sheets --rows 7
```

`audit:stills` samples three frames per component at 15% / 50% / 90% of the timeline
(enter, hold, exit) and writes `<slug>@<point>.png` plus a `report.json`. One webpack
bundle and one browser cover the whole catalog; the per-component `render:component`
path boots a browser each time and is far too slow for a full pass.

`audit:montage` packs the stills into review sheets, one row per component and three
columns for the samples, dead previews first. 109 components fit in 16 sheets, which
is what makes a full visual pass affordable.

**D6 is measured, not eyeballed.** The report carries a PSNR in dB for each adjacent
pair of samples. Comparing PNG bytes does not work — a visually frozen frame still
re-encodes a few bytes differently — so the harness shells out to ffmpeg. Above ~38 dB
two samples are indistinguishable; `dead: true` means both pairs cleared it.

A high score is not automatically a defect: an enter-only primitive legitimately holds
after it settles, and `fade-out` legitimately holds before it leaves. The metric
locates candidates; the sheets decide.

## Criteria

### D1 — Legibility at tile size
Type must stay readable when the frame is scaled to 308 px. A 1920 px frame at tile
size is a 6.2× reduction, so 24 px preview type lands at under 4 px. Any text that
carries meaning needs to survive that; decorative type may not.

### D2 — Frame fill
The subject should occupy a meaningful share of the frame. A component centred in an
otherwise empty 16:9 stage reads as a bug at tile size. Target: the animated subject
covers at least a third of the frame area at the hold sample.

### D3 — Aspect fit
Vertical (9:16) compositions must not be letterboxed into a 16:9 tile. Either the
preview reframes the component for landscape or the tile respects the composition's
own aspect ratio.

### D4 — Single coherent idea
One preview demonstrates one component. Overlapping text layers, colliding elements,
or two unrelated demos in one frame all fail.

### D5 — Theme adherence
Previews carry a fixed dark stage (`BRAND_STAGE`). On a light page this reads as a
hole. Either every preview commits to the dark stage as a deliberate "film strip"
treatment, or the stage follows the page theme. Mixed behaviour fails.

### D6 — Motion legibility
The three samples must differ visibly. If enter, hold, and exit look identical the
preview communicates nothing about what the component animates.

### D7 — Render health
The component renders without throwing, and without hydration mismatches when mounted
in the Next.js docs page.

## Severity

- **P0** — component renders blank, errors, or shows the wrong component.
- **P1** — fails D1/D3/D4: actively misleading about what the component does.
- **P2** — fails D2/D6: technically correct but weak as a preview.
- **P3** — fails D5 only, or cosmetic polish.

## Audit results — 2026-08-15 (second pass, full visual walk)

All 16 sheets reviewed. **109/109 render, 0 errors, 0 dead.** Frozen tails are down
from 20 (12 pixel-identical plus 8 near-frozen) to 12, and every one of the 12 is a
deliberate hold — see the judgment below. Nothing on the open list is a defect the
metric can find; what remains is framing, which it cannot.

### What the sheets could not judge

**D3 is not measurable from a review sheet.** The five 9:16 previews look
letterboxed on every sheet because `audit:montage` pads each cell to one 16:9 box
— `xstack` refuses ragged inputs. The product surfaces both derive the tile's
aspect from the composition: `atlas-mini-preview.tsx` falls back to
`height > width ? "9 / 16" : "16 / 9"`, and `component-contact-sheet.tsx` reads
the same from `previewMeta()`. `social-clip`, `creator-reel`, `podcast-clip`,
`tutorial-clip` and `talking-head-layout` are **not** letterboxed in the app. The
Aug 5 D3 item is closed; judge it in the browser, never on a sheet.

### Closed this pass

- **Dead previews (5 → 0).** Four were preview timing — the motion finished
  before the 15% sample or fell between samples. Two were component bugs found
  underneath: `map-canvas` had `zoom` in the deps of its map-*creation* effect,
  so any frame-driven camera rebuilt the MapLibre instance every frame and never
  removed the old one; `map-markers` held no `delayRender` around its paint, so
  the markers dropped out of whichever frame the browser captured first (visible
  as a bare basemap at `map-markers@0.15` in every run before the fix).
- **Frozen tails (20 → 12, all deliberate).** See the judgment below.
- **`progress-bar`** filled in 54 frames of a 110-frame window and then sat at 82%
  for the back half. A progress bar that has stopped is not a progress bar.
- **`map-flight`.** The mid-Atlantic leg cruised at 2,200,000 m, which framed
  open water — a flat blue plate with a line across it. Now 4,600,000 m, which
  keeps Newfoundland and Ireland in frame.
- **`perspective-marquee`.** The floor plane hangs below the frame, so tracks
  placed low on it landed under the bottom edge; the near row was cut through
  its baseline. Both tracks moved up the plane.
- **`image-expand`.** A composition named for an image that never showed one —
  a flat gradient at the hold and near-black at the exit. It now takes `src`,
  and its exit is centred on the last tenth of the window instead of finishing
  at frame 115 of 120.
- **The three "text collisions" were one asset.** `DEMO_MEDIA_SRC` bakes a
  headline into its lower-left band, exactly where a scene puts its label chip,
  its callout card and its lower third. `split-screen`, `zoom-pan-frame` and
  `callout-spotlight` all covered it and read as clipping bugs. Added
  `DEMO_MEDIA_PLAIN_SRC` / `DEMO_MEDIA_ALT_PLAIN_SRC` for scenes that supply
  their own copy; the titled stills stay where the still *is* the subject.
  `split-screen` also moved its panel chips off the bottom edge for the same
  reason — that placement fights any footage carrying a lower third.
- **Aug 5 P1s.** `data-story`, `showcase` and `stagger-children` verified fixed
  on the sheets alongside `hero-loop` and `karaoke-captions`.
- **Duration drift.** `metric-ticker` and `caption-scene` had MDX overrides
  (100 and 120) that disagreed with `preview-config` (120 and 150) — the docs
  page played a different length than the audit rendered. Every scene MDX page
  now omits `durationInFrames`, so `lib/preview-config.ts` is the single source.

### The frozen-tail judgment

Split by kind, as the rubric implies:

- **Enter-only primitives hold, and that is correct.** `marker-highlight`,
  `matrix-decode`, `slot-roll`, `staggered-fade-up`, `strikethrough-replace`,
  `tracking-in`, `blur-focus-in`. No change.
- **Two "primitives" were not enter-only.** `masked-slide-reveal` finished all
  three lines by frame 28, so every sample caught settled type; `light-sweep-text`
  is a *travelling* highlight, and a 48-frame sweep left five sixths of the loop
  showing dead grey. Both retimed to span the window.
- **Scenes holding is a defect, and trimming the window does not fix it.**
  `quote-card` and `stat-card` have beats of roughly a second; no window short
  enough to hide the hold is long enough to watch. They needed an exit, not a
  shorter loop. `holdSeconds` — the idiom `caption-bumper` and `lower-third`
  already had — is now on `quote-card`, `stat-card`, `feature-list`,
  `callout-spotlight` and `metric-ticker`. It defaults to `undefined`, so a scene
  inside a `TransitionSeries` still holds and lets the transition cover the tail.
- **`end-card`, `caption-scene` and `hook-card` still hold, deliberately.** An
  end card's job is to be the last thing on screen; `hook-card` carries a slow
  six-second push that keeps it alive.

The 12 that still measure frozen at the tail, and why each is correct:
`blur-focus-in`, `marker-highlight`, `matrix-decode`, `slot-roll`,
`staggered-fade-up`, `strikethrough-replace`, `tracking-in`, `fade-in`,
`line-chart-draw` — enter-only primitives that settle and stay settled.
`caption-scene`, `end-card`, `hook-card` — scenes whose job is to hold.
Four measure frozen at the *head*: `fade-out` and `transition-light-leak` hold
before they leave, which is what they are for; `lower-third` settles fast and now
leaves across the 90% sample; `dynamic-grid` is a background primitive whose grid
barely reads at tile size, which is the framing item below, not a timing one.

**Time an exit to straddle the 90% sample**, not to finish before it:
`holdSeconds ≈ 0.9 × window / fps − exitFor / 2`. `lower-third` was the
counter-example — it already had `holdSeconds={3.2}`, which completed the exit at
frame 109 of 150 and left the tile holding an *empty* plate for the last quarter
of every loop. An early exit trades a frozen tail for an empty one, which is worse.

### Still open — P2, framing

Not defects in behaviour; the subject is small or the frame is thin at 308 px.
`chat-gpt` and `claude-chat` (a thin input bar on a large light field — also the
last two light stages), `v0`, `opencode`, `infinite-marquee`, `tool-menu-slide`,
`code-diff-wipe`, `code-reveal`, `code-accordion`, `data-flow-pipes`,
`audio-pulse`, `progress-bar`, `timeline-steps`, `dynamic-grid` (the grid barely
reads; the card in that tile is preview chrome). `perspective-marquee` still
carries its marquee in the lower third — that is what a floor marquee is, and
changing `floorTilt` did not meaningfully help.

The five transition previews open on a light "Scene one" by design, to make the
wipe legible. That is a deliberate D5 exception, not the mixed behaviour the
criterion is about.

## Audit results — 2026-08-15 (first pass)

Full re-run after the transitions, atoms, maps, creator and composition rebuilds.
**109 of 109 renderable slugs rendered, zero render errors, zero resolve failures.**
The Aug 5 pass counted 112 slugs; the registry has since settled at 109 renderable
components plus 17 lib and 1 hook entry with no preview wrapper.

Most of the Aug 5 list is closed. What the rebuilds actually fixed:

- **Both P0s are gone.** `caption-highlight` and `caption-scene` now carry the caption
  through all three samples.
- **The 22-component dead-loop class is down to 5.** Machine-measured, not eyeballed.
- **Four of the seven P1s verified fixed on the sheets:** `hero-loop` (three clean
  panels, no clipped headline), `karaoke-captions` (highlight moves across all three
  samples), and the caption pair above.

### Open — dead previews (5)

Nothing moves across the whole window. All five confirmed on sheet 1.

- `blur-focus-in` — headline already resolved by the 15% sample; the blur is never seen.
- `map-canvas` — static basemap. It is a base layer, so this may be correct behaviour
  and wrong as a *preview*; it needs a subject, not a fix.
- `map-markers` — markers are already placed at 15%; the drop-in never shows.
- `rgb-glitch-text` — the glitch is short enough that all three samples miss it.
- `split-screen` — frozen, and the "Launch dashboard" heading is clipped by the
  `Prototype` badge.

### Open — frozen tail (12)

Samples at 50% and 90% are pixel-identical (PSNR inf): `caption-bumper`,
`feature-list`, `light-sweep-text`, `marker-highlight`, `masked-slide-reveal`,
`matrix-decode`, `quote-card`, `slot-roll`, `staggered-fade-up`, `stat-card`,
`strikethrough-replace`, `tracking-in`. Eight more are near-frozen (39–71 dB):
`callout-spotlight`, `progress-bar`, `metric-ticker`, `fade-in`, `line-chart-draw`,
`hook-card`, `end-card`, `caption-scene`.

These are the tiles that sit still on the contact sheet for the back half of every
loop. Enter-only primitives may be correct here; the compositions are not.

### Open — frozen head (4)

`fade-out` and `transition-light-leak` hold before they move, which is what they are
for. `dynamic-grid` (96.2 dB) and `lower-third` (45.8 dB) are worth a look.

### Not yet re-reviewed

Sheets 2 and 4–16 have not had a visual pass since the re-run. The remaining Aug 5
P1/P2 items in them — `data-story`, `showcase`, `map-flight`, `stagger-children`,
`perspective-marquee`, the four subject-too-small items, the three text collisions,
the five letterboxed verticals and the six light stages — are unverified either way.
`image-expand` is a new candidate: its third sample is nearly empty.

## Audit results — 2026-08-05

108 of 112 renderable slugs sampled at 3 frames each. The 4 that did not render are
lib/hook registry entries with no preview wrapper.

### Fixed

- **12 transitions ended on an empty frame.** `transition-previews.tsx` used
  `SCENE_DURATION = 54`, so two scenes overlapping by 18 frames filled only 90 of the
  120-frame composition and the last quarter of every transition tile was black. Now
  derived from `PREVIEW_DEFAULTS.durationInFrames`. Verified by re-render.
  Affected: blur-reveal, chromatic-aberration-wipe, directional-wipe,
  frosted-glass-wipe, grid-pixelate-wipe, spatial-push, zoom-through,
  transition-clock-wipe, transition-fade, transition-light-leak, transition-slide,
  transition-wipe.
- **Preview framing divergence.** The docs player mounted previews at 960x540 while
  `EXPORT_DEFAULTS` rendered them at 1920x1080, from two hand-maintained copies of the
  same duration/size table. Single-sourced into `lib/preview-config.ts`.

- **`confetti-burst` and `dynamic-grid` rendered the wrong component.** Not a nesting
  problem: `wave-batch-previews.tsx` still held stale copies of 11 preview exports
  (`ConfettiBurstPreview`, `DynamicGridPreview`, `MeshGradientBgPreview`,
  `SimulatedCursorPreview`, `DeviceMockupZoomPreview`, `TerminalSimulatorPreview`,
  `CodeAccordionPreview`, `CodeDiffWipePreview`, `DataFlowPipesPreview`,
  `DragDropFlowPreview`, `ChatToPreviewPreview`). The site imported the per-file
  previews; `buildPreviewIndex` keyed by export name and silently kept whichever file
  it read last, so every render and still of those slugs showed a preview nobody sees.
  Duplicates deleted, and the index now throws on a duplicate slug. The four
  bare-slug transitions it also shadowed (`directional-wipe`, `spatial-push`,
  `chromatic-aberration-wipe`, `zoom-through`) now have `EXPORT_OVERRIDES` entries.
- **Preview renders used export defaults, not docs framing.** `resolveExportConfig`
  now reads `previewMeta()` for preview-sourced renders and passes `--scale=2`, so a
  render matches the page and the "half-size subject" note below is closed.
  `ComponentPage` reads the same table, so an MDX page cannot drift either.

### Open — P0

- `caption-highlight`, `caption-scene` — caption present at 15%, gone at 50% and 90%.
  The `Sequence` is bounded by one caption page's duration, which is shorter than the
  composition.

### Open — P1

`hero-loop` (clipped panels, headline cut mid-word), `data-story` (heading overlaps
ghost text), `showcase` (ends on a counter reading 0), `map-flight` (frame 2 is an
empty void, no tiles at that zoom), `karaoke-captions` (highlight only visible in the
first sixth of the loop), `stagger-children` (ghost layer collides with card),
`perspective-marquee` (content cropped at the bottom edge).

### Open — P2

- Dead loop, animation finishes before 15%: fade-in, fade-out, blur-in, blur-focus-in,
  scale-in, slide-left, slide-up, rotate-in, spring-in, tracking-in, light-sweep-text,
  rgb-glitch-text, auto-fit-title, intro, title-card, hook-card, caption-bumper,
  comment-callout, callout-spotlight, masked-slide-reveal, map-canvas, map-markers.
- Subject too small at 308px: progress-bar, tool-menu-slide, mesh-gradient-bg, counter.
  (`logo-reveal`, `path-draw`, `cursor-path`, `simulated-cursor` were rebuilt — see
  "Paths & shapes rebuild" below.)
- Text collision: stat-card, code-reveal, zoom-pan-frame.
- 9:16 letterboxed into a 16:9 tile: social-clip, creator-reel, podcast-clip,
  tutorial-clip, marker-highlight. `component-contact-sheet.tsx` hard-codes
  `aspectRatio="16 / 9"`.

### Open — P3

Six previews use a light stage against 100+ dark ones: caption-highlight,
karaoke-captions, chat-gpt, claude-chat, v0, waveform-line.

### Needs a video render, not stills

`audiogram-bars` and `audiogram-scene` show a flat, unchanging bar envelope across all
three samples. Stills cannot distinguish dead spectrum analysis from saturation.

## Paths & shapes rebuild — 2026-08-05

All four components in the lane were rebuilt from scratch rather than patched.

- **`lib/path-utils`** grew from two helpers to a measuring layer: cached `getLength`
  and `getBoundingBox`, `fitViewBox()` (frames artwork from its own bbox),
  `samplePath()` (arc-length position plus tangent angle), `waypointsToPath()`
  (cardinal spline through waypoints) and `waypointProgress()` (where a waypoint sits
  along the built path, so events fire on arrival).
- **`path-draw`** takes `string | string[]` and staggers multi-stroke marks, auto-fits
  its viewBox, rides a head dot on the tip, and can flood a `fill` in behind the
  stroke once the outline closes.
- **`cursor-path`** travels by arc length instead of by segment index, draws its trail
  in behind the cursor (`trail="draw" | "guide" | "none"`), and ripples at the
  waypoints named in `clickAt` — timed from the path, not hand-offset.
- **`simulated-cursor`** springs each hop separately, presses on click, and gained
  per-waypoint `target` rings and `label` chips.
- **`logo-reveal`** is a real four-beat scene: bloom, mark draw-on, wordmark spring,
  tagline. Sizes the mark from the short edge and grows it when no copy is passed.
  Verified at 960x540 and 1080x1920.

**SVG trap worth remembering:** a filter's region defaults to a share of the element's
bounding box, and a straight horizontal or vertical path has a zero-area box — the
stroke disappears entirely. `path-draw` pins its glow filter with
`filterUnits="userSpaceOnUse"` over the viewBox.

## Two failure modes PSNR cannot see

Both were found by looking at rendered stills after the numbers came back
clean, during the atoms batch (2026-08-15). Neither is detectable from the
three-point PSNR pairs alone.

### An exit that empties the 90% frame

Opacity is gone by roughly 70% of an exit window, so an exit beginning at
frame 88 leaves frame 108 — the 90% sample — completely blank. PSNR *passes*,
because a blank frame differs from a full one as much as any motion does.

Keep the exit late enough that the last sample still has something in it. On
the 120-frame default, start exits at 96, not 88.

### An oscillation aliased against the sample gaps

The samples sit at frames 18, 60 and 108, so the gaps are **42 and 48 frames**.
A periodic preview whose period divides near either gap puts two of the three
stills on the same phase of the cycle: numerically healthy, visually a still
image. A 44-frame sine and a 46-frame axis morph both did this.

Check an oscillating preview's period against 42 and 48, not against the
120-frame window. Periods near 32–34 land the three samples on distinct
phases.

## Two more, from the backgrounds and effects batch (2026-08-15)

### A blend mode that makes a working component invisible

`animated-noise-grain` measured 52.8 dB — flat dead — with nothing wrong with
it. The default blend is `overlay`, which pivots around mid grey; the preview
stage is `#050505`. Grain composited onto near-black changes nothing, so the
component rendered perfectly and produced three identical frames.

Any component whose output is a blend — grain, scanlines, a grille, a vignette,
anything that works by *removing* or *modulating* light — has nothing to work
with on the dark stage. `scanline-crt` had the same problem visually: the
numbers passed because of its rolling bar, but the tube was empty and every
overlay was invisible. Give those previews a picture, not a plate.

Also worth knowing: the audit renders at `--scale 0.5` by default, which
averages fine, high-frequency detail out of existence. Grain that reads at
1080p can measure as a static frame at 480px. Coarsen the preview rather than
trusting the component's defaults.

### A periodic preview that never samples the pose the component is *for*

`squash-stretch` on a 33-frame bounce measured 16.6/21.4 dB — healthy, three
different heights — and put all three samples mid-flight. The squash, which is
the entire point, was never in a still. Retimed to 27 frames so frame 108 is
exactly a contact frame.

The rule the PSNR pairs cannot express: pick the period so that a sample lands
on the component's signature pose, not merely so the samples differ. The same
check applies to any impulse component — `shake-emphasis` needed a repeat
interval (28) chosen so one sample sits on the hit and one sits at rest.
