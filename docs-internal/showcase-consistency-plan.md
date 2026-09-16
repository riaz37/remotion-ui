# Showcase consistency plan

Written 2026-09-16 after a category-by-category audit of our component showcase against
a clone of `Remocn/remocn`. The question behind it: why does their registry read as more
premium than ours when our components are not worse.

## Diagnosis

**They decorate outside the video. We decorate inside it.**

remocn's demo *is* the bare component, mounted with the defaults from its `config.ts` on a
flat fill. They explicitly neuter their own frame primitive in docs —
`<Backdrop padding={0} radius={0} shadow="" />` — and then let the site chrome carry every
bit of polish: one `Frame` component, one `.surface-card` class, one elevation token set.
308 components, one place that controls how they look. It cannot drift.

Ours, measured across the 178 files in `apps/web/components/previews/`:

| | count |
|---|---|
| distinct hex values | 67 |
| files hardcoding hex | 35 |
| files inventing their own card/panel chrome | 22 |
| distinct `borderRadius` values | 10+ (999, 8, 10, 99, 6, 24, 28, 22, 20, 12) |
| files using the shared furniture kit | 32 / 178 |
| files reading the stage tokens via `usePreviewStage` | 14 / 179 |
| wrapper regimes | 3 — 103 `PreviewFrame`, 51 `ScenePreviewPlate`, 24 none |
| padding values | 0 (65), 72 (47), 56 (6), 64 (1), 20 (1) |
| stage backgrounds | 5+ near-blacks side by side |

So roughly 146 previews are each hand-art-directed *inside the frame*. That is 178 separate
design decisions where they have one.

**The counterintuitive part.** Their stage colors are messier than ours — ~25 distinct
backdrops, 75 light vs 63 dark. On paper we are more uniform. But their *containers* are
identical, so the eye reads a system and forgives varied contents. Our containers vary and
our contents vary, so the eye reads noise. Uniform stage color was never the thing.

### Secondary gaps, same audit

- **Geometry.** They pin 1280×720 for 193/299 entries, fps 30 for 293/299. We default
  960×540 with a per-slug override table.
- **Duration.** Theirs is a tight 2–5s histogram (120×47, 90×46, 70×40, 150×33). Ours is
  115 entries at 120 and then a spread from 48 to **1800** — two marquees run 60 seconds
  inside a 308px tile.
- **Typography.** Negative tracking on ~117 of their components (`-0.01em`×50,
  `-0.03em`×36), 72px as the house hero size, a fixed weight enum everywhere. We have no
  tracking convention and ink hardcoded seven ways (`#D8DCE4`, `#f4f4f5`, `#dcdcdc`,
  `#F3E7D2`, `#fafafa`…).
- **Enforcement.** They ship a `ComponentConfig` contract in 294 `config.ts` files and a CI
  test that fails the build when a registry item has no page. We have three competing
  taxonomies, a `lane` prop wired to a dead function, and 15 slugs with no poster.

## Principle for the work

> Polish belongs in the chrome, which there is one of. The video carries the component and
> nothing else.

Every phase below is an application of that sentence.

## Phase 0 — baseline evidence

A full stills pass is the only honest before/after: headless browser screenshots show every
`<Player>` paused at frame 0, so they prove nothing.

```
pnpm --filter web audit:stills --out <scratch>/stills --scale 0.5
pnpm --filter web audit:montage --stills <scratch>/stills --out <scratch>/sheets --rows 7
```

Keep the `before` sheets. Re-run after each visual phase and compare sheets, not opinions.

## Phase 1 — chrome, and the surface split

**This is most of the perceived gap and it is two files.**

A finding that shapes the phase: our two tile surfaces are not the same design, and must
not get the same treatment.

- `components/landing/component-contact-sheet.tsx:114-115` is a deliberate `gap-px` grid on
  a border-colored background — a hairline contact sheet. This is our filmstrip identity
  and it is good. **Do not turn it into a grid of rounded cards.** Uniformity there means
  making the tile *contents* consistent (phases 3–4), not adding chrome.
- `components/studio/scaled-player-stage.tsx:34-41` is the doc-page player, currently bare:
  `relative w-full overflow-hidden bg-[var(--bay-stage)]` — no border, no radius, no
  padding, no elevation. A dark video with no frame reads as a hole in the page. **This is
  where the frame treatment belongs.**

Work:

1. Add elevation tokens to `app/globals.css`. None exist today — confirmed by grep. Define
   a raised and a raised-hover step in both the light block (`:16-25`) and the dark block
   (`:47-56`), alongside the existing `--bay-*` tokens. Dark mode should reduce to close to
   a single hairline ring; heavy shadows on near-black read as dirt.
2. Frame the doc-page player in `scaled-player-stage.tsx`: outer padded shell, inner stage
   with radius + `--bay-border` hairline + the new elevation. Keep the existing
   `aspectRatio` and portrait branches exactly as they are — they are correct and the
   portrait path (`max-w-[380px]`) is load-bearing for the five 9:16 slugs.
3. Give the atlas grid card a hover lift using the same tokens
   (`components/component-card.tsx:34`, currently flat `rounded-md border p-4`).

Verify: doc page at both aspects, atlas grid, contact sheet unchanged. Light and dark.

## Phase 2 — un-shadow `laneAccent`

One deletion, and category identity starts working.

`components/previews/preview-frame.tsx:123` declares:

```ts
export function laneAccent(_lane: PreviewLane): string {
  return "#ececec";
}
```

It ignores its argument and shares its exact name with the real implementation at
`lib/lane-visuals.ts:59`, which returns a per-lane hue (`oklch(0.55 0.06 <hue>)`). The
previews import the dead one, so ~103 components pass a `lane` prop that changes nothing —
every category looks identical by accident. The local `PreviewLane` union at
`preview-frame.tsx:37-46` is likewise a duplicate of `AtlasLane`.

Work: delete both, import from `lib/lane-visuals` and `lib/atlas`, and surface the accent in
the **chrome** (tile border, doc-page frame edge, lane badge) rather than inside the video.
Same principle as phase 1 — this is why it is cheap.

Note: this is the same class of defect as the duplicate-preview shadowing already on record.
Worth a grep for other same-name pairs across `lib/` and `components/` while in here.

## Phase 3 — normalize what is inside the frame

The real refactor, but it is targeted: **~50 files, not 178.** The list is the 32 that use
the shared furniture kit plus the 22 that hand-roll card/panel chrome.

1. **One radius scale.** Collapse the 10+ values to a small set (pill / card / tile).
2. **One ink, one stage.** Route the 67 hexes through the stage tokens; the five near-black
   stages become `--bay-stage`. Bespoke overrides worth keeping (`scanline-crt` at
   `#101010`, the CRT idiom) must be a documented exception, not a drive-by.
3. **Furniture out of the video.** Titles, kickers and labels that exist only to explain the
   component belong in the doc-page chrome. Furniture that *is* the component's subject
   (a `ProductCard` inside a scene demo) stays.
4. **Tracking pass.** A `-0.02em` default on the preview type kit; this is the single
   strongest typographic tell of premium motion work and we apply it nowhere.
5. **The 24 wrapper-less previews** (compositions + maps) inherit no stage, no padding and
   no font. Bring them onto a wrapper or document why each is exempt.

Verify per batch with `audit:stills` + montage against the phase 0 sheets. Do not batch more
than one category at a time.

## Phase 4 — the cheap correctness items

- **Duration contradiction (a straight bug).** `lib/composition-playground.ts:11` social-clip
  **228** vs `lib/preview-config.ts:131` **216**; podcast-clip **366** vs **294**. The same
  composition plays two lengths on one page. `preview-config` is meant to be the single
  source — make it so.
- **Cap tile durations.** Nothing over ~180f in a tile. The two 1800f marquees need a
  preview window, not their real length.
- **Kill duplicated copy.** "Ambient layer" is the kicker on 6+ background/shader previews
  with the component's own name as the title and the same two `DEMO_COPY` subtitles; all 18
  transitions ship one identical copy pair ("Editorial opener"/"Feature spotlight"). Their
  transition demos label each scene per component.
- **15 slugs have no poster** and fall through to `DesignedFallback` in the grid. Either
  generate the posters or remove the loader entries.
- **Thin copy** in paths-and-shapes ("Winner", "this one").

## Non-goals

- **Do not touch charts.** 19 components, uniform pad 72, uniform 120f, real funnel data —
  the strongest category we have. Leave it.
- **Do not chase their component count.** 308 is padded: 102 are icons.
- **Do not port their shaders.** Separate lane, separate decision, and there is an open
  provenance record there.
- **Do not add a light stage** to fix contrast. It was tried; the comment at
  `components/previews/ai-composer-previews.tsx:10-13` records why both composers are forced
  dark — a light plate was one of the last holes in a sheet of 100+ dark tiles.

## Order and effort

| phase | scope | payoff |
|---|---|---|
| 1 — chrome | 2 files + tokens | most of the visible gap |
| 2 — laneAccent | 1 deletion + imports | category identity, ~103 previews |
| 3 — inside the frame | ~50 files | removes the scatter at source |
| 4 — correctness | scattered small | one real bug, several papercuts |

Phases 1 and 2 are small and reversible. Phase 3 is the one that needs a fresh context
budget and should be done one category at a time, each verified against sheets.

## What actually happened (2026-09-16 execution)

Phases 0, 1, 2 and 4 were run. Two premises above turned out to be wrong; both are
corrected here so the next pass does not repeat them.

**Phase 1 item 2 was wrong and was reverted.** `scaled-player-stage.tsx` is bare
*on purpose*: both callers mat it themselves. `components/docs/scene-monitor-preview.tsx`
(the real doc-page player, rendered from `component-page.tsx:50`) already wraps it in a
card + `p-2.5` mat + ring, with a comment stating the same "reads as a hole" rationale
this plan claimed was unaddressed; `program-monitor-workspace.tsx` runs it flush between
its header and `TimecodeBar`. Adding a shell inside the stage double-mats the doc page
and breaks the monitor strip. The file now carries a comment recording this. What *was*
kept from phase 1: the elevation tokens in `globals.css` and the atlas card hover lift.

**Phase 2's premise was wrong.** The dead `laneAccent` in `preview-frame.tsx` was never
imported by anything — the three real consumers already read from `lib/lane-visuals`. The
`lane` prop was inert because it is destructured-and-dropped, not because of shadowing.
So phase 2 was a type/dead-code cleanup worth zero visual change, and the "category
identity, ~103 previews" payoff in the table below never existed.

**Lane accent is now wired** (answers the first open question by building it): tiles tint
the hover border in `components/studio/clip-card.tsx`, the doc page tints the existing mat
ring in `scene-monitor-preview.tsx`. Existing borders are tinted rather than new hairline
bars added.

**Phase 4** found the duration bug had a *third* stale copy (`registry.json:1260`), and
`strikethrough-replace` had no loader at all. 15 slugs still need `pnpm gen:posters`:
blur-focus-in, dither-field-bg, grain-gradient-bg, infinite-marquee, light-sweep-text,
light-tunnel-bg, masked-slide-reveal, matrix-decode, perspective-marquee, rgb-glitch-text,
slot-roll, staggered-fade-up, text-reveal-shader, tracking-in, warp-bands-bg.

**The phase 0 baseline was contaminated** — it was rendered concurrently with the editing
agents, and the pass is alphabetical over ~22 minutes, so late-alphabet slugs captured
edits mid-flight. A clean `stills-pre-phase3` / `sheets-pre-phase3` pair was re-rendered
on a quiet tree. Sequence evidence capture *before* editing next time.

## Phase 3 progress (2026-09-16, same day)

Started from the clean `stills-pre-phase3` baseline. Kit-level first, because two of
the five items live entirely in `preview-stage.tsx` / `preview-frame.tsx` and reach
every preview that uses the shared type components.

**Item 4 (tracking) — done.** `PREVIEW_TRACKING = "-0.02em"` in `preview-stage.tsx`,
applied to `previewTextStyle`, `PreviewHeadline` and the `MetricPanel` value, plus the
one local copy in `shape-morph.tsx`. That was the whole of the item: there were only
four `letterSpacing: 0` sites in the catalog, three of them in the kit. Verified on
title-card / feature-list / showcase / end-card / hook-card / quote-card renders.

**Item 1 (radius) — done at the kit level, deliberately not swept further.**
`PREVIEW_RADIUS = { pill: 999, panel: 8, card: 24 }`, adopted by `ProductCard`,
`MetricPanel`, `CodePanel`, `MediaTile` and the chip/node plates.

The plan's "collapse the 10+ values" was over-broad. Reading the stragglers
(`lower-third` 28/22/24, `notification-stack` 20, `multi-device-lineup` 6/99,
`parallax-layers` 6 …) they are all *decorative backdrop blobs* — abstract shapes
standing in for an app behind the component — not panels the eye compares across
tiles. Rounding them to the scale is churn with a real risk of nudging art direction
for no perceptible gain. The scale's value is that it exists and the kit uses it, so
new components pick from it. **Leave decorative backdrop radii alone.**

**Item 2 (one ink, one stage) — partially done.** Routed through tokens:
`orbit-motion`, `liquid-text-morph`, `stroke-to-fill-text`, `waveform-bars-radial`,
`arrow-annotate`, `connector-lines`. Added one token the kit was missing —
`panelSolid` — because `panelFill` is translucent by design and the annotation chips
sit *over* drawn artwork, which is why those files had each picked their own near-black
(`#0B0C11` three ways). Renders are pixel-equivalent to the baseline: this was
deduplication, not restyling.

Left as documented exceptions, not oversights: `scanline-crt` (`#101010`/`#dcdcdc`,
the CRT idiom), the `#83838d` / `#71717a` legibility tuning in
`text-effects-previews` which carries its own rationale comment, `svg-mask-reveal`'s
warm `#F3E7D2` ink on a warm revealed plate, and `#100c06` in `glow-pulse` /
`depth-of-field-blur` (dark ink *on* a bright element, not a stage).

Still open in item 2: the ~8 gradient backdrops that each hand-mix a near-black
(`line-chart-draw`, `audio-pulse`, `waveform-line`, `audiogram-bars`,
`audio-reactive-scale` share one literal gradient string — that wants extracting to a
shared constant more than it wants tokenising).

**Items 3 and 5 not started.** Item 3 (furniture out of the video) and item 5 (the 24
wrapper-less previews) both need per-file judgment about what is chrome and what is
the component's subject; note that most of the 24 are transitions, which render two
scenes and may be legitimately exempt — check before "fixing" them.

**New finding.** `showcase` and `feature-list` render an *identical* 50% frame. Not
duplicate-preview shadowing: the `Showcase` composition's midpoint genuinely is a
feature-list beat, and both read `DEMO_COPY.productLaunch.featureTitle`. Give the
composition its own copy — this is the phase 4 "duplicated copy" papercut, one case
of it that reads as a bug in the contact sheet.

## Open questions

- Does the lane accent read at 308px tile size, or does it only work on the doc page?
- Should the five 9:16 slugs get a native-aspect tile on the contact sheet, or keep the
  deliberate pillarbox? (`component-contact-sheet.tsx:41-52` chose pillarbox on purpose.)
- Is 1280×720 worth adopting over our 960×540 preview default, or is that churn for nothing
  now that the stills harness and both product surfaces all read `previewMeta()`?
