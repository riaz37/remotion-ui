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

## Session 2 — what landed

- **`GlassHeadline` border fixed.** `barrelDistortion()` writes `vec4(0.0)` for any sample outside the texture and exposes only `amount`, so no clamp is reachable. Replaced with a first-party `lensWarp` (`showcase/spike/src/lens-warp.tsx`) that divides the warped coordinate by `1 + amount` — the largest stretch the warp can produce — so no sample can leave the texture. Verified clean at `0.1` and at `0.6`.
- **`gpu` registry lib** (`lib/gpu.ts`) — `makeShaderEffect({ fragmentShader, calculateKey, setUniforms })` wraps the program/quad/texture plumbing. `uSource` and `uResolution` are bound before `setUniforms` runs. Use this for every further GPU primitive.
- **`mesh-gradient-bg` swapped in place** and is better than the CSS original: same props, same drift, no blur banding. It is also one of the twelve contact-sheet slugs, so it plays live on the landing page.

## The candidate rule — earned, not guessed

Two components were attempted and only one survived. The rule that fell out:

- **Good candidate** — CSS is *approximating a per-pixel field* with gradients and blur. `mesh-gradient-bg` was three blurred radial-gradient divs standing in for a distance function. The shader is strictly better and cheaper.
- **Bad candidate — vector identity.** `aurora-bg` is tapered SVG paths whose *shape* changes per frame, with 13 props (`blur`, `striation`, `seed`) that map badly onto uniforms. **Skipped deliberately.** SVG expresses this well; a port risks making it worse.
- **Bad candidate — the filter pipeline is the algorithm.** `caustics-bg` sums five wave trains, then `blur()` → `contrast()` turns that sum into the sharp web. **Attempted over four iterations and reverted.** An analytic threshold on the exact sum gives ragged patches, not ridges; a 12-tap disc average did not close the gap because the blur radius is small against the wavelength. The CSS version is better and was already refined through two rejected cuts. Do not retry without a real separable blur pass.

## What the first-thirty-seconds audit actually found

The landing page renders **live `<Player>`s for twelve slugs** in the contact sheet — that is the surface, and being live it is tier-1-only. The twelve: `data-story`, `karaoke-captions`, `terminal-simulator`, `device-mockup-zoom`, `social-clip`, `audiogram-scene`, `lower-third`, `grid-pixelate-wipe`, `ai-generation-canvas`, `logo-reveal`, `code-reveal`, `mesh-gradient-bg`.

**None of the other eleven compose the background primitives** — each inlines its own CSS gradient. So swapping primitives reaches the sheet only through `mesh-gradient-bg` itself. **This is the open decision:** either accept that primitive swaps mostly improve their own docs pages, or give the sheet's scenes GPU backdrops directly, which changes each scene's design and is a bigger call than a swap.

## Still open

1. **Decide the question above** — primitive-by-primitive, or go at the eleven scenes' inline backdrops.
2. **Remaining tier-1 primitives worth testing against the candidate rule:** `animated-noise-grain` (feTurbulence — a shader does real noise, CSS cannot), `light-rays`, `particle-field`, `topographic-lines-bg`, `scanline-crt`. Apply the rule before writing any shader.
3. **Apply the existing 69 shipped effects to components that already exist.** Still the highest quality-per-hour move and still barely started — `scanline-crt`→`scanlines`, `animated-noise-grain`→`noise`, `glow-pulse`→`glow`, `transition-light-leak`→`light-leak`, `topographic-lines-bg`→`contour-lines`.
4. **Decide the tier-2 preview story** — pre-rendered video previews on the docs site, since tier 2 can't play live for most visitors.

## Traps, both cost a render to find

- **`vUv.y = 0` is the bottom of clip space.** Anything positioned from DOM percentages must flip it. The mirrored output still looks like a plausible background, so only a side-by-side against the old version catches it.
- **`half` is a reserved word in GLSL ES.** Shader compile errors are thrown loudly by `lib/gpu.ts` — keep that guard, since the silent failure mode is a black frame with the render still exiting 0.

## Two honest limits

- Tier-1 browser-safety was proven from Remotion's source, **not** from a live non-Chrome browser. Little room for doubt, but not a screenshot.
- The spike proves the mechanism is available to us. It does **not** prove our taste through it beats theirs. Put our dissolve next to remocn's dither-dissolve before committing to a large rebuild.

## Do not resume

Component-building for count, and the launch push. Per project memory `remocn-competitor-finding`, launching onto weaker components spends the one shot at attention teaching the audience the wrong answer. Assets (hero loop, 4 demo clips, blog) are ready and keep.
