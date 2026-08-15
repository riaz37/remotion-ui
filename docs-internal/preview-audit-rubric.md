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

## Audit results — 2026-08-15

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
