# 3d lane handoff — Sep 16 2026

Branch: `feat/3d-components` (not pushed, no PR). Base: `main` at `c753d3e`.

## What shipped

The `3d` lane went from one component to five. All four new scenes are implemented,
rendered at 150 frames, and had real frames inspected before being called done.

```
690d590 feat(3d): implement text-extrude-3d
2122211 feat(3d): implement globe-points-3d
b1488d2 feat(3d): implement product-turntable-3d
f06ee1e feat(3d): register four 3D scenes, implement card-stack-3d
99b74fa chore(showcase): unify preview visuals, add conduct policy and hero tooling
```

`99b74fa` is unrelated pre-existing work (showcase consistency phases 0-3, CODE_OF_CONDUCT.md,
the README hero script) committed first so the 3D diff stays readable.

Green at the end: `tsc --noEmit` clean, `registry:build` 235 items, `validate-registries` 235
resolved, `component-categories` 25/25.

| Slug | What it is |
|---|---|
| `product-turntable-3d` | Machined platter turns a product one revolution. Zero-asset fallback is a lathed bottle whose label is drawn into a canvas at runtime. Optional `src` takes a GLTF. |
| `text-extrude-3d` | Per-glyph `ExtrudeGeometry` with a lit bevel, letters tumbling up on a staggered spring under a camera pull-back. |
| `card-stack-3d` | Five `RoundedBox` cards of real thickness fanning from an edge-on pile. Faces procedural. |
| `globe-points-3d` | Opaque lit sphere, dot-matrix landmass, instanced pins, fresnel atmosphere, depth-tested tube arcs. |

## Start here

**The peer-session problem is still open.** These four files are uncommitted in the working
tree and belong to another Claude session that was working on the README hero:

```
 M .github/assets/readme-hero.webp
 M apps/web/showcase/promo/src/Root.tsx
 M apps/web/showcase/readme-hero/src/readme-hero.tsx
?? apps/web/showcase/promo/src/readme-hero.tsx
```

They landed here because this session ran `git checkout -b feat/3d-components` while that
session was mid-flight — one working tree, shared by every session. Nothing is lost. Ask the
user before moving them; do not stash or cherry-pick on your own initiative. See the
`branch-switch-hits-peer-sessions` memory.

## Known gaps, none blocking

- **GLTF clip animation is unproven visually.** `mixer.setTime(frame / fps)` is implemented to
  the spec rule in `product-turntable-3d` but no clipped sample asset was ever rendered. The
  static GLTF path *was* proven live against Khronos `DamagedHelmet.glb`.
- **`cancelRender` failure branches are code-reviewed only** — nobody forced a failing font or
  model fetch.
- **Any PSNR baseline taken now is contaminated.** Four agents rendered into a shared scratchpad
  concurrently. Re-render on a quiet tree first (see the `baseline-stills-need-a-quiet-tree` memory).
- **`text-extrude-3d` ships a 31KB typeface** at `apps/web/public/fonts/geist-bold.typeface.json`
  (Geist, OFL, license beside it). `npx remotion-ui add text-extrude-3d` will **not** copy it into
  a consumer's `public/`. The scene's doc comment points at `remotionui.com/fonts/…`, which only
  resolves once this branch deploys. **The MDX should say this** and currently does not.
- **`globe-points-3d` continents are noise-generated**, not Earth's, so a real city coordinate can
  land just off a generated coast. It ships no labels, so it reads as a deliberate abstract data
  globe. Recognisable geography needs a coastline dataset or texture, which the lane's no-asset
  rule excludes. Flagged as a judgement call, not yet accepted or rejected by the user.

## Traps this round paid for

**Every one of the four components had a defect that rendered green and exited 0.** A render
exiting 0 proves nothing in this lane; extract frames and look at them.

- Lights placed behind the subject leave the whole camera-facing hemisphere a muddy blob with a
  thin rim crescent. Always put a camera-side key in.
- `torusGeometry` builds in the **XY plane**. An unrotated ring stands up like a handle across
  the frame; it needs `rotation-x={-Math.PI / 2}`.
- Detail geometry placed coplanar-or-below a surface is swallowed and reads as a dead black disc.
- A `spring` is 0 on its first frame, so an entrance driven by one leaves **frame 0 empty** — and
  frame 0 is where posters and still exports come from. Give the rise a head start.
- Eased beats all settle. Without a linear or periodic term running underneath, the tail parks and
  the stills audit flags it.
- CSS colour strings assigned to a `vec3` uniform leave it **silently unset**. Pass `new THREE.Color(...)`.
- A `useMemo` after an early return changes hook order on frames that take the other branch.
- `zsh` aborts a whole `&&` chain on an unmatched glob (`rm -f f_*.png`), which silently produces
  no frames to inspect.

## Lane mechanics worth not rediscovering

- **`gen:component` refuses any slug not in `docs-internal/expansion-200-spec.md`.** The heading is
  parsed by `/^##\s+(\w+)\s+—\s+\+\d+/`, so adding components means bumping the count in the heading
  *and* adding table rows. The 3d table has no Tags column.
- **The digit trap.** The scaffold names wrappers `…3dPreview` with a lowercase d
  (`ProductTurntable3dPreview`), and neither that casing nor `3D` round-trips through preview
  auto-discovery. Every `-3d` slug needs an explicit `source.exportName` in `EXPORT_OVERRIDES`
  (`apps/web/lib/component-export.ts`) alongside `GL_RENDER_FLAGS`.
- **Beyond the scaffold's 8 registration points**, each of these needed by hand: the three/drei
  dependency array and emptied `registryDependencies` in `registry.json`, a 150-frame duration in
  `preview-config.ts` (120 is too short for the 15/50/90% audit samples to land on three different
  camera states), the MDX moved into `content/docs/components/(3d)/` with `meta.json` "pages"
  updated, and the `browse.mdx` lane row.
- **The determinism contract now lives in the spec's 3d section** — banned drei helpers by name,
  the safe list, the GLTF mixer rule, and the postprocessing caveat. Read it before writing a
  fifth scene.

## Suggested next steps

1. Resolve the peer-session files with the user.
2. Add the typeface-install note to `text-extrude-3d.mdx`.
3. Get a ruling on the noise-generated continents.
4. Re-render baseline stills on a quiet tree, then `audit:stills` / `audit:frames` the lane.
5. Posters (`gen:posters`) and README tiles if these earn a place, then push and open the PR.
