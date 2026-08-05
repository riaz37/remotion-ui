# Preview audit rubric

Every registry component ships a preview wrapper in `apps/web/components/previews/`.
Those wrappers are rendered in two places with very different constraints:

- **Tile** — the landing page contact sheet and the atlas grid, roughly 308 px wide.
- **Doc page** — the component reference page, roughly 800 px wide.

The audit judges each preview at both sizes against the criteria below. Evidence is
rendered stills, not browser screenshots: the docs `<Player>` stays paused at frame 0
in headless Chromium, so screenshots show every component at opacity 0.

```
pnpm --filter web audit:stills --out /tmp/stills
```

Samples three frames per component at 15% / 50% / 90% of the timeline (enter, hold,
exit) and writes `<slug>@<point>.png` plus a `report.json` of failures.

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
