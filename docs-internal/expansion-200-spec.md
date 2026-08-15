# Expansion spec: 109 → 200

Status: **deduped against the existing 115 registry entries.** This is the source list the scaffold generator will consume.

Every entry below was checked against the description of every shipped component. 32 of the first-draft entries collided and were replaced — see [Rejected](#rejected-do-not-rebuild) at the bottom, which is the more useful half of this document.

## Allocation

| Lane | Now | Add | Target |
|---|---:|---:|---:|
| signals (data & media) | 10 | **+28** | 38 |
| atoms (primitives) | 27 | **+24** | 51 |
| blocks (scenes) | 30 | **+23** | 53 |
| vectors (paths & shapes) | 4 | **+7** | 11 |
| cuts (transitions) | 12 | **+6** | 18 |
| spatial (maps & device) | 5 | **+3** | 8 |
| reels (compositions) | 21 | **+0** | 21 |
| **Total** | **109** | **+91** | **200** |

Weights shifted after dedup: spatial collapsed from +8 to +3 because `device-mockup-zoom` already covers laptop, phone, and browser — the four device components in the first draft were one component with different props. That headroom moved to atoms and blocks, which had the most genuinely-unoccupied space.

**Why reels stays at 21:** a composition is 10–20× the build cost of a primitive and is the hardest thing to keep visually correct. Adding 91 parts raises the value of the 21 that exist, because each can be re-cut with better pieces. Revisit after the 91 land.

**Anti-goal:** no easing variants, no prop-shaped-as-component. The dedup pass killed 13 entries that were really props on things we already ship. Apply the same test to anything added later: if it's one boolean away from an existing component, it's a prop.

---

## signals — +28

### Charts (16)

| Slug | Tags | Tier | Intent |
|---|---|---|---|
| `bar-chart-race` | charts | advanced | Ranked bars reorder over time. Distinct from `animated-bar-chart`, which is a static ranking with a value axis. |
| `donut-chart` | charts | core | Multi-segment donut with labels. Narrowed from "progress ring" — `stat-card` already owns the single-value ring. |
| `pie-slice-reveal` | charts | core | Slices sweep in sequentially. |
| `scatter-plot-pop` | charts | advanced | Points pop in on stagger, optional trend line. |
| `bubble-chart-pack` | charts | advanced | Circle-packed values settling into place. |
| `gauge-dial` | charts, metrics | core | Needle sweeps to target. |
| `sparkline-row` | charts, metrics | core | Compact trend lines that read at small sizes. |
| `heatmap-grid` | charts | advanced | Cell grid filling by intensity, contribution-graph style. |
| `comparison-bars` | charts | core | Two-series before/after with delta callout. |
| `funnel-chart` | charts | core | Stage bars narrowing with drop-off percentages. |
| `radar-chart` | charts | advanced | Multi-axis spider chart drawing its polygon. |
| `treemap-blocks` | charts | advanced | Nested rectangles sized by value. |
| `waterfall-chart` | charts | advanced | Cumulative bridge with positive/negative steps. |
| `stacked-area-chart` | charts | advanced | Multiple series stacking as they draw on. |
| `candlestick-chart` | charts | advanced | OHLC financial series. |
| `gantt-timeline` | charts | advanced | Date-scaled schedule bars. Distinct from `timeline-steps`, which walks a process without a time axis. |

### Captions (5)

| Slug | Tags | Tier | Intent |
|---|---|---|---|
| `srt-caption-track` | captions | core | Renders directly from SRT/VTT. **Utility, not a look** — unblocks every caption style for real transcripts. |
| `word-pop-captions` | captions | core | **Narrowed:** one word at a time, alone on frame. `caption-highlight` and `karaoke-captions` both show a full line with an active word; this shows no line context at all. |
| `caption-emoji-beat` | captions, social | advanced | Emoji punctuation landing on beats. |
| `speaker-label-captions` | captions | advanced | **Narrowed:** multi-speaker caption track with name tags and color coding. `talking-head-layout` is a framing scene, not a track. |
| `transcript-scroll` | captions | core | Full readable transcript scrolling with the active line marked. A document, not a caption overlay. |
| `subtitle-translate` | captions | advanced | Dual-language stacked subtitles. |

### Audio (7)

| Slug | Tags | Tier | Intent |
|---|---|---|---|
| `audio-reactive-scale` | audio | core | Wrapper: scales any child by amplitude. **Primitive** — composes with everything. |
| `waveform-bars-radial` | audio | core | Circular bars around a center element. Distinct geometry from `audiogram-bars`. |
| `vu-meter` | audio | core | Segmented level meter with peak hold. Level, not spectrum. |
| `voice-note-bubble` | audio, social | core | Chat-style audio message with waveform and playhead. |
| `beat-pulse-grid` | audio | advanced | Grid cells pulsing on detected beats. |
| `audio-scrubber` | audio | core | Waveform with traveling playhead and time labels. |

> **Dependency:** the audio group needs per-frame amplitude. Confirm what `audiogram-bars`/`audio-pulse` already wrap; extract that into `audio-reactive-scale` first so all seven share one path.

---

## atoms — +24

### Enter / exit (1)

| Slug | Tags | Tier | Intent |
|---|---|---|---|
| `skew-in` | enter | core | Skew + translate, editorial feel. |

> This group lost four of five entries to dedup. `spring-in` already ships bouncy and snappy presets; `rotate-in` already hinges in depth; `slide-*` already mask-reveal. The entrance space is genuinely full.

### Text (9)

| Slug | Tags | Tier | Intent |
|---|---|---|---|
| `split-text-chars` | text | core | **Build first.** Split a string into chars, words, or lines with stagger. The foundation the other text effects compose against instead of re-implementing splitting. Absorbs the cut `word-by-word-reveal` as a mode. |
| `scramble-text` | text | advanced | Random-glyph scramble resolving per character. Distinct from `matrix-decode`, which is column rain. |
| `text-mask-video` | text | advanced | Video or gradient showing through letterforms. |
| `handwriting-text` | text | advanced | Takes a **string** and strokes it on. `path-draw` takes a path; that's the line between them. |
| `stroke-to-fill-text` | text | core | Outline text filling solid. |
| `variable-font-morph` | text | advanced | Animates weight/width axes of a variable font. |
| `liquid-text-morph` | text | advanced | Letterforms morphing between two words. |
| `wave-text` | text | core | Per-character sine displacement. |
| `neon-flicker-text` | text | core | Neon sign flicker and settle. |

### Backgrounds (6)

| Slug | Tags | Tier | Intent |
|---|---|---|---|
| `aurora-bg` | background | core | Drifting light ribbons. Ribbons, not blobs — `mesh-gradient-bg` owns blobs. |
| `particle-field` | background | core | Ambient drifting particles with depth. Continuous, unlike `confetti-burst`. |
| `topographic-lines-bg` | background | core | Contour lines drifting. |
| `caustics-bg` | background | advanced | Underwater light caustics. |
| `animated-noise-grain` | background | core | Film grain overlay. **Watch render cost** — precompute or use CSS, don't generate noise per frame. |
| `light-rays` | background | core | Volumetric god rays drifting across the stage. Distinct from `light-sweep-text` (text-only) and `mesh-gradient-bg` (blobs). |

### Effects (8)

| Slug | Tags | Tier | Intent |
|---|---|---|---|
| `parallax-layers` | — | core | Depth-offset layers on one driver. Multi-layer, unlike `zoom-pan-frame`'s single still. |
| `shake-emphasis` | — | core | Short impact shake. |
| `glow-pulse` | — | core | Rhythmic glow for CTAs and live indicators. |
| `motion-trail` | — | advanced | Echo trails behind a moving element. |
| `squash-stretch` | — | core | The animation principle as a primitive. |
| `orbit-motion` | — | core | Element orbiting a center point. |
| `depth-of-field-blur` | — | advanced | Rack focus between layers. `blur-focus-in` is text-only; this is spatial. |
| `scanline-crt` | — | core | CRT scanlines and curvature overlay. |

---

## blocks — +23

### Creator (3)

| Slug | Tags | Tier | Intent |
|---|---|---|---|
| `poll-overlay` | creator, social | core | Question with bars filling to results. |
| `reaction-burst` | creator, social | core | **Narrowed:** hearts/likes rising continuously. `confetti-burst` is a single impulse. |
| `countdown-timer` | creator | core | Numeric or ring countdown to zero. |

### UI flows (5)

| Slug | Tags | Tier | Intent |
|---|---|---|---|
| `form-fill-sequence` | ui | core | Fields typing and validating in order. |
| `notification-stack` | ui | core | Toasts stacking and dismissing. |
| `tab-switch-panel` | ui | core | Tab bar with cross-fading panels. |
| `kanban-move` | ui | core | Cards moving across columns. `drag-drop-flow` is one file into one drop zone. |
| `search-results-populate` | ui | core | Query typed, results streaming in and ranking. |

### Code (2)

| Slug | Tags | Tier | Intent |
|---|---|---|---|
| `file-tree-reveal` | code | core | Directory tree expanding node by node. |
| `commit-graph` | code | advanced | Branch/merge graph drawing itself. |

### Content & layout (13)

| Slug | Tags | Tier | Intent |
|---|---|---|---|
| `comparison-table` | — | core | Multi-column feature matrix. `feature-list` is a single ticked list. |
| `pricing-card` | — | core | Tier card with price roll and features. Block-grain; `pricing-focus` is a full composition. |
| `faq-accordion` | ui | core | **Narrowed:** Q/A text rows expanding. `code-accordion` is code-specific, `timeline-steps` is process. |
| `team-grid` | — | core | Avatar grid with role labels on stagger. |
| `logo-wall` | — | core | Client logo grid, grayscale to color. |
| `changelog-entry` | — | core | Version header with categorized change rows. |
| `roadmap-lanes` | — | core | Swimlanes of shipped/building/planned. |
| `org-chart-build` | — | advanced | Hierarchy assembling top-down. |
| `quiz-question` | social | core | Question, options, correct-answer reveal. `poll-overlay` has no right answer. |
| `weather-card` | — | core | Conditions with animated iconography. |
| `sports-scorebug` | — | core | Broadcast score furniture with clock. |
| `news-ticker-bar` | — | core | Broadcast lower ticker with headlines. `infinite-marquee` is a generic text loop primitive. |
| `calendar-month-fill` | — | core | Month grid populating with events. |

---

## vectors — +7

| Slug | Tier | Intent |
|---|---|---|
| `arrow-annotate` | core | Hand-drawn arrow pointing at a target. |
| `shape-morph` | advanced | Path interpolation between two shapes. |
| `blob-morph` | core | Organic blob continuously morphing. An SVG shape, not a background. |
| `dashed-path-travel` | core | **Narrowed:** any element traveling any path with a dashed trail. `cursor-path` is cursor-specific. |
| `connector-lines` | advanced | **Narrowed:** primitive that draws edges between anchored elements. `data-flow-pipes` is a full scene with payloads. |
| `svg-mask-reveal` | core | Arbitrary SVG shape as a reveal mask. |
| `badge-stamp` | core | Stamp/seal impact with rotation settle. |

> **Dependency:** `shape-morph` and `connector-lines` share a path-interpolation helper. Build it once.

---

## cuts — +6

| Slug | Tier | Intent |
|---|---|---|
| `transition-circle-reveal` | core | Circular mask expanding from a point. |
| `transition-card-flip` | core | Whole-frame 3D flip. |
| `transition-blinds` | core | Slats sweeping. |
| `transition-whip-pan` | core | Fast pan with motion blur. |
| `transition-morph-shape` | advanced | Shape mask morphing between scenes. |
| `transition-liquid-warp` | advanced | Liquid displacement warp. |

> **Contract:** all six must satisfy the displace contract from the transitions rebuild. The last two are displacement-map variants — build the shared displacement core once, then they're config.

---

## spatial — +3

| Slug | Tier | Intent |
|---|---|---|
| `map-heat-overlay` | advanced | Density overlay fading in over the basemap. |
| `globe-arc` | advanced | Arcs between points on a globe. |
| `multi-device-lineup` | advanced | Phone + tablet + laptop showing one responsive design. The only device entry that survived — extend `device-mockup-zoom`'s hardware detail, don't fork it. |

> **Blocker:** both map entries inherit the MapLibre trap — every frame needs its own `delayRender`/`continueRender` around tile load, or renders come back silently *wrong*, not blank. Reuse the `map-canvas` pattern.

---

## Build order

Ordered by unblocking power, not lane size.

1. **Foundations (5)** — `split-text-chars`, `audio-reactive-scale`, `srt-caption-track`, the path-interpolation util, the displacement-transition core. Roughly 20 downstream entries become configuration once these exist.
2. **cuts +6** — smallest and most mechanical; proves the batch workflow end to end.
3. **atoms +24** — high reuse, low risk.
4. **vectors +7** — fast once the path util exists.
5. **signals +28** — the strategic lane. Charts, then captions, then audio (audio last; it depends on the amplitude wrapper being solid).
6. **blocks +23** — highest value, highest cost; needs the primitives to compose from.
7. **spatial +3** — last; the map pair are the highest-risk renders in the list.

## Gate

Every batch through `audit:stills` before merge. No component ships on a green type-check alone — the last rebuild's defects (5 dead previews, 20 frozen tails) were all type-clean. Batch size 8–12 so a montage sheet is reviewable in one pass.

---

## Rejected: do not rebuild

32 first-draft entries that collided with shipped components. Kept here so they don't get re-proposed.

### Already exists under another name

| Rejected | Shipped as |
|---|---|
| `number-odometer` | `counter` — "…an odometer roll" |
| `kpi-grid` | `metric-ticker` — "KPI cards that count themselves in" |
| `tiktok-captions` | `caption-highlight` — "TikTok-style word highlight captions" |
| `spectrum-analyzer` | `audiogram-bars` — "Audio-reactive spectrum bar visualization" |
| `checklist-reveal` | `feature-list` — "A list being ticked off, row by row" |
| `before-after-slider` | `split-screen` — "A before/after that is actually made" |
| `cta-endscreen` | `end-card` |
| `caption-box-lower` | `caption-scene` — "Lower-third captions" |
| `gradient-text-sweep` | `light-sweep-text` |
| `dot-matrix-bg` | `dynamic-grid` — "drifting dot and line grid" |
| `gradient-orbs` | `mesh-gradient-bg` — "Living gradient blobs" |
| `underline-scribble` | `marker-highlight` — "…underline and box variants" |
| `flip-in` | `rotate-in` — "hinged in depth on the x or y axis" |
| `bounce-in`, `elastic-pop` | `spring-in` — "snappy, smooth and bouncy presets" |
| `map-zoom-chain` | `map-flight` |
| `transition-glitch-cut` | `chromatic-aberration-wipe` — "pull the colour channels apart" |
| `transition-film-burn` | `transition-light-leak` — "a film flare" |
| `laptop-mockup-scroll`, `tablet-mockup`, `mobile-app-frame`, `phone-tilt-3d` | `device-mockup-zoom` — "laptop, phone, or browser mockup" |

### Was a prop, not a component

| Rejected | Belongs as |
|---|---|
| `area-chart-fill` | a `fill` prop on `line-chart-draw` |
| `map-pin-drop` | a drop-animation prop on `map-markers` |
| `signature-write`, `icon-draw` | `path-draw` with a different asset |
| `testimonial-card` | `quote-card` with an avatar |
| `wipe-in` | the mask reveal `slide-left`/`slide-up` already have |
| `log-stream` | `terminal-simulator`, which already streams build output |
| `word-by-word-reveal` | a word mode on `split-text-chars` |
| `leaderboard-rows` | `bar-chart-race` with row styling |
| `cursor-click-tour` | `cursor-path`, which already draws trail and click ripples |

## Open questions

- **`bar-chart-race` data shape.** Pre-computed rankings per keyframe, or raw time series interpolated at render? Decide before building, it changes the prop API.
- **Docs volume.** 91 new MDX pages is a real content load. The generator should emit a usable first draft (props table, one example, preview embed) so hand-editing is polish, not authoring.
- **Generator still owed.** 91 × 9 registration points is what kills this. Nothing in `scripts/` scaffolds a component today.
