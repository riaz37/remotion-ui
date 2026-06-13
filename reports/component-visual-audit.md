# RemotionUI Component Visual Audit

Date: 2026-06-13

Audited local docs at `http://localhost:3000` using Playwright screenshots of 57 component docs routes. Raw screenshots were captured in `/private/tmp/remotionui-visual-audit-cli`; persistent contact sheets are stored beside this report:

- [Full docs overview](visual-audit-assets/contact-full.jpg)
- [Preview-area crop overview](visual-audit-assets/contact-preview-crop.jpg)
- [Scenes crop overview](visual-audit-assets/contact-scenes.jpg)
- [Compositions crop overview](visual-audit-assets/contact-compositions.jpg)
- [Updated targeted fixes](visual-audit-assets/contact-updated-fixes.jpg)

## Executive Summary

The main visual problem is not one isolated bug. The registry currently reads like a technical demo set rather than a video component product. Many previews use the same dark navy stage, same blue accent, same centered text, same abstract SaaS mockup imagery, and generic copy such as `RemotionUI`, `Product demo`, `Watch this`, and `Data story`.

There are also concrete placement issues: several previews are blank or near-blank at the captured autoplay moment, lower-third content sits under the player controls, two-up/media layouts are cramped inside the docs player, and a set of map/transition components has no live visual preview at all.

## High-Priority Findings

### P0: Several registry pages have no visual preview

Affected pages:

- `spatial/map-canvas`
- `spatial/map-route`
- `spatial/map-markers`
- `cuts/transition-fade`
- `cuts/transition-slide`
- `cuts/transition-wipe`
- `cuts/transition-clock-wipe`
- `cuts/transition-light-leak`

Evidence:

- `apps/web/content/docs/spatial/map-canvas.mdx:6` renders `<ComponentPage name="map-canvas">` with no `preview`.
- `apps/web/content/docs/cuts/transition-fade.mdx:6` renders `<ComponentPage name="transition-fade">` with no `preview`.
- The contact crop sheet shows these pages displaying docs/code blocks where a motion preview should be.

Why it matters:

These are motion components. Without a visual preview, users cannot evaluate the animation, timing, or install value. Transition helpers especially need side-by-side scene previews.

Recommended fix:

Create small docs-only preview components for transition helpers and low-level map primitives. For maps, use a deterministic SVG/canvas fallback if MapLibre tiles are unreliable in embedded Remotion players.

### P0: Some previews are effectively blank at the autoplay capture moment

Affected examples:

- `fade-out`
- `hero-loop`
- portions of `lower-third`

Evidence:

- `primitives/fade-out` is blank in the screenshot after the docs player autoplayed for roughly one second.
- `compositions/hero-loop` is too dark and low-contrast in its first visible moment; it looks like a dim placeholder rather than a hero video.
- `lower-third` content appears only as a tiny element near the bottom edge.

Why it matters:

The docs preview is the sales surface. If a preview is blank, users read the component as broken or low-value even when the underlying primitive works.

Recommended fix:

For exit primitives, make the docs preview loop a visible object through an enter-hold-exit cycle instead of showing only the raw fade-out state. For long compositions, choose a stronger first scene or start the docs preview at a representative frame.

### P1: Lower-third content is too low and too small inside the player

Affected file:

- `apps/web/registry/bases/default/scenes/lower-third/index.tsx`

Evidence:

- The readable content is positioned with `position: "absolute"` and `bottom: safeArea.paddingBottom` at `apps/web/registry/bases/default/scenes/lower-third/index.tsx:35`.
- In the docs preview, the Remotion player controls overlap the same bottom zone, making the name/title hard to read.

Why it matters:

Lower thirds are one of the components most likely to be judged by placement. The current preview makes the component look cramped and under-designed.

Recommended fix:

Reserve a lower-third slot above player controls for docs previews, or add bottom clearance to the component itself. Use a stronger demo background/media frame so the overlay reads as an overlay, not text on an empty navy frame.

### P1: Media layouts are cramped and content competes for attention

Affected examples:

- `b-roll-stack`
- `split-screen`
- `media-frame`
- `media-sequence`
- `zoom-pan-frame`

Evidence:

- `b-roll-stack` uses a two-column grid plus an absolutely stacked card pile at `apps/web/registry/bases/default/scenes/b-roll-stack/index.tsx:35` and `apps/web/registry/bases/default/scenes/b-roll-stack/index.tsx:49`. In the preview, the headline and stacked cards compete and the media labels are hard to parse.
- `split-screen` places two media panels plus a title into a short 16:9 preview at `apps/web/registry/bases/default/scenes/split-screen/index.tsx:93`. The title sits near the top edge and the panel labels sit near the player controls.

Why it matters:

These components should feel like usable video layouts. In the docs player they currently feel like compressed web cards.

Recommended fix:

Create stronger reserved layout slots and reduce simultaneous readable elements. For small 16:9 docs previews, show either title + one media focal point or two media panels without extra internal text. Use time to reveal labels rather than displaying everything at once.

### P1: The visual language is too generic across the registry

Affected broadly:

- Most primitives
- Most signals
- Several blocks and reels

Evidence:

- `apps/web/components/previews/preview-frame.tsx:16` sets the default preview root to a centered `AbsoluteFill` with one background color.
- Many previews reuse generic copy and abstract assets: `RemotionUI`, `Product demo`, `Data story`, `Watch this`, `Show the workflow`, `Jane Doe`, `Soft UI Demo`.
- The crop overview shows many components as dark navy frames with blue accents and centered white text.

Why it matters:

The components may be technically correct, but users cannot tell what kind of video they help produce. Everything blends into one demo style.

Recommended fix:

Define 3-5 distinct demo worlds and assign components to them, for example:

- Creator/social: portrait video, captions, comments, talking-head frames.
- Product launch: bright product UI, punchy feature scenes, CTA.
- Data story: charts, metrics, editorial pacing.
- Podcast/audio: waveform/audiogram, host art, transcript snippets.
- Spatial/travel: map, route, place labels, travel card.

Then update previews to use domain-specific copy and assets instead of `RemotionUI` placeholders.

### P1: Full compositions start with generic title cards

Affected examples:

- `data-story`
- `tutorial-clip`
- `social-clip`
- `showcase`
- `intro`

Evidence:

- `apps/web/components/previews/data-story.tsx:6` passes data, but the captured first scene is a generic `Data story` title.
- `apps/web/components/previews/tutorial-clip.tsx:6` starts with `Show the workflow`.
- `apps/web/components/previews/social-clip.tsx:7` wraps the composition in a generic preview frame and the first visible moment is `Watch this`.

Why it matters:

The first frame should reveal the actual composition value. Currently the first frame often looks like an intro slide, not a template users want to copy.

Recommended fix:

Start docs previews at a representative middle scene or shorten the intro. The thumbnail moment should show the component's core behavior: charts moving, captions syncing, a demo frame being spotlighted, or a CTA/end-card sequence.

### P2: Text is often below video-readable size

Affected examples:

- `code-reveal`
- `metric-ticker`
- `timeline-steps`
- media card labels in `b-roll-stack` and `split-screen`

Evidence:

- `code-reveal` uses `fontSize: Math.round(width * 0.022)` for code at `apps/web/registry/bases/default/scenes/code-reveal/index.tsx:27`, which becomes tiny in docs previews.
- `timeline-steps` uses four columns with `fontSize: 21` descriptions at `apps/web/registry/bases/default/scenes/timeline-steps/index.tsx:40`.
- `metric-ticker` shows three compact cards with small labels in one frame.

Why it matters:

Video components need to read at video distance. Small text can be decorative, but these components appear to expect users to read the details.

Recommended fix:

Prefer fewer items per scene, larger type, and progressive reveal. For code, crop to one important snippet or use callouts rather than showing a full code block.

## Category Notes

| Category | Status | Notes |
| --- | --- | --- |
| Primitives | Mixed | Most are technically legible, but generic. `fade-out` becomes blank during autoplay. Simple labels do not sell practical use cases. |
| Signals | Mixed | Audio/caption components render, but many share the same navy/blue look. Metric/chart previews are readable but small and dashboard-like. |
| Vectors | Acceptable | `path-draw`, `line-chart-draw`, and `cursor-path` render, but the previews feel sparse and should use stronger final compositions. |
| Spatial | Incomplete | `map-flight` has a visual fallback; `map-canvas`, `map-route`, and `map-markers` have no live preview. |
| Cuts | Incomplete | Transition helpers have no live preview, which makes the category hard to understand visually. |
| Scenes | Mixed | Stronger than primitives, but several scenes are cramped or generic. `lower-third`, `b-roll-stack`, `split-screen`, and `code-reveal` need layout/design attention first. |
| Compositions | Generic | They render, but first visible moments are mostly title slides. The previews need to show the real payoff earlier. |

## Recommended Work Plan

1. Add missing previews for `cuts/*` and `spatial/map-canvas`, `spatial/map-route`, `spatial/map-markers`.
2. Fix blank/weak preview timing for `fade-out`, `hero-loop`, and long compositions.
3. Rework the most visible layout issues: `lower-third`, `b-roll-stack`, `split-screen`, `code-reveal`.
4. Create a demo-art-direction system with distinct demo worlds, copy, colors, and assets.
5. Re-capture the same 57-route audit sheet and compare before/after.

## Progress Update: 2026-06-13

Completed first implementation slice:

- Added live docs and atlas previews for `cuts/transition-fade`, `cuts/transition-slide`, `cuts/transition-wipe`, `cuts/transition-clock-wipe`, `cuts/transition-light-leak`, `spatial/map-canvas`, `spatial/map-route`, and `spatial/map-markers`.
- Updated `fade-out` docs preview to hold a visible demo card before the exit animation, so autoplay no longer captures a blank frame.
- Lifted `lower-third` content above the bottom player-control danger zone and widened the reserved text slot.
- Moved `b-roll-stack` and `split-screen` media labels away from the bottom controls.
- Increased small readable text in `code-reveal` and `timeline-steps`.

Validation:

- `pnpm --filter web lint`
- Direct registry build from `apps/web`: `pnpm -s exec tsx scripts/build-registry.mts`
- Playwright screenshots for the targeted fixed routes, saved as [Updated targeted fixes](visual-audit-assets/contact-updated-fixes.jpg).

Remaining work:

- `hero-loop` and full composition first-frame art direction still need a dedicated pass.
- The broader generic visual-language issue remains. The next slice should define the demo worlds and replace placeholder copy/assets across previews.
- `lower-third`, `b-roll-stack`, and `split-screen` are improved but would still benefit from richer demo assets and less generic product-copy treatment.

## Validation Notes

Commands/tools used:

- `pnpm dev` against the existing local Next server at `http://localhost:3000`
- `pnpm -s exec playwright install chromium firefox webkit`
- `pnpm -s exec playwright screenshot ...` for 57 docs routes

Limitations:

- Screenshots capture the docs preview after a short autoplay wait, not every frame of every animation.
- The audit prioritizes docs-visible component quality. A component may behave better later in its timeline than the captured first preview moment.
