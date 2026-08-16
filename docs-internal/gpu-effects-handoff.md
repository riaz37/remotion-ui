# GPU effects — handoff

Written 2026-08-16. Branch: `spike/gpu-effects` (commit `27a2cfd`). Main has only `b21ea36`, the composition-id fix.

## Why this work exists

The user judged remocn's components "much more polished and more beautiful than ours." Investigation found the cause is **GPU rendering, not craft**:

- 70 of remocn's 136 motion components touch shaders. We had **zero lines of first-party WebGL** across 204 registry files.
- Ruled out as causes, with numbers: easing discipline (we centralize the same `Easing.bezier(0.16, 1, 0.3, 1)` in `lib/timing.ts` that they inline), letter tracking (70/204 vs their 56/136), shadow layering (52 vs 25 — we lead), blur (27 vs 37).
- Their count is padded: 282 claimed = 140 motion + 47 UI + **102 animated icons**. Non-icon, it's 187 vs our 222. Neither side wins on breadth.

**Do not spend time re-deriving any of the above.** It is settled.

## The thing that collapsed the plan

Remotion already ships the entire layer. All of it was available at our 4.0.505 and none of it was ever imported:

| API | Since |
|---|---|
| `@remotion/effects` — **69 effects** | 4.0.464 |
| `<Solid>` — shader backgrounds | 4.0.464 |
| `<HtmlInCanvas>` — DOM → texture → shader | 4.0.455 |
| `makeHtmlInCanvasPresentation()` | 4.0.456 |
| `createEffect()` — custom GLSL/WebGPU | 4.0.479 |

remocn's 702-line `canvas-presentation.tsx` reimplements `makeHtmlInCanvasPresentation()`; its vertex shader is byte-identical to Remotion's docs example. **The work is adoption, not invention.**

## The tier split — this decides build order

- **Tier 1** — `<Solid>`/`<Img>`/`<Video>`/shapes + effects. Plain WebGL2. **Verified flag-free at source**: `drawElementImage` appears only in `src/HtmlInCanvas.tsx` in remotion's bundle; `<Solid>` paints its own canvas via the effect chain with `useDelayRender`. Works in the docs Player for every visitor. **Build here first.**
- **Tier 2** — `<HtmlInCanvas>` and html-in-canvas transitions. *Preview* needs Chrome 149 + `chrome://flags/#canvas-draw-element`. *Rendering* is unaffected — Remotion ships its own Chrome with the flag on. remocn's flagship transitions are tier 2, so they likely don't play live for most of their visitors. That is the seam.

## What already landed

- `setChromiumOpenGlRenderer("angle")` in `apps/web/remotion.config.js`, `templates/remotion-app/`, `packages/remotion-ui/templates/remotion-app/`. Without it, GPU components render blank or unshaded **and the render still exits 0** — silent wrong output. Verified by re-rendering with no `--gl` flag.
- Three reference implementations in `apps/web/showcase/spike/src/`, each rendered and checked frame by frame.

Render a spike composition:

```bash
cd apps/web
npx remotion render --config=remotion.config.js showcase/spike/src/index.ts ShaderField /tmp/out.mp4
```

This bypasses the registry's 9 registration points — good for spikes. See project memory `composition-wiring-checklist` for real registration.

## Tuned values that worked

| Component | Setting | Note |
|---|---|---|
| `GlassHeadline` | `barrelDistortion 0.04` | 0.12 leaves black corners |
| `GrainDissolve` | `grain 24, softness 0.45, sweep 0.6` | |

The grain-dissolve fix was **structural, not numeric**: pure per-cell noise makes every cell flip independently and reads as TV static. Blending the threshold toward a diagonal ramp makes the dissolve travel while still breaking along a grain edge.

## Next session

1. **Finish `GlassHeadline`** — faint dark rounded border at the frame edge, from barrel sampling past texture bounds. Either drop barrel (keep chromatic + scanlines) or clamp the sample. Small.
2. **Audit the registry for GPU candidates.** This list does not exist yet and was deliberately not guessed. Sort on:
   - *Tier 1* — anything containing a background, gradient, or field. Cheapest wins, shows live on the site. Likely concentrated in the `atoms` lane.
   - *Tier 2* — text/UI whose pixels want a lens or material treatment. Only where the treatment is the point.
   - *Neither* — charts, captions, code panels. Appeal is layout/data/timing; a shader makes those worse.

   **The real sort is which components a visitor tries in the first thirty seconds.** That input comes from the user, not the code — ask.
3. **Apply the existing 69 effects to components that already exist.** We use 3. Highest quality-per-hour in the library; beats authoring new components.
4. **Decide the tier-2 preview story** — pre-rendered video previews on the docs site, since tier 2 can't play live for most visitors.

## Two honest limits

- Tier-1 browser-safety was proven from Remotion's source, **not** from a live non-Chrome browser. Little room for doubt, but not a screenshot.
- The spike proves the mechanism is available to us. It does **not** prove our taste through it beats theirs. Put our dissolve next to remocn's dither-dissolve before committing to a large rebuild.

## Do not resume

Component-building for count, and the launch push. Per project memory `remocn-competitor-finding`, launching onto weaker components spends the one shot at attention teaching the audience the wrong answer. Assets (hero loop, 4 demo clips, blog) are ready and keep.
