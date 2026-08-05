---
name: remotionui-agent
description: >-
  Build Remotion videos with RemotionUI: CLI install workflow,
  composition registration, and agent indexes. Use when the user wants
  captioned social clips, creator reels, data stories, or programmatic video.
metadata:
  tags: remotion, remotion-ui, video, compositions, cli
---

# RemotionUI Agent

Use this skill when helping users build **full Remotion compositions** with RemotionUI, not one-off effects.

## Hard rules

- Use [Remotion docs](https://www.remotion.dev/docs) for framework fundamentals.
- Use RemotionUI for ready-made **source components** copied into the user's repo.
- Run `npx remotion-ui@latest add <component>` before importing a component.
- Import from local paths: `@/compositions/...`, `@/remotion/scenes/...`, `@/remotion/primitives/...`
- **Never** import UI components from the `remotion-ui` npm package — it ships a CLI only, not a component library. Components are copy-pasted source files, like shadcn/ui.

## Remotion animation rules (mandatory)

RemotionUI components are plain Remotion source files. All render-time motion must be driven by Remotion's frame-based primitives, not browser-timing APIs, because output is rendered frame-by-frame server-side, not played back live in a browser:

- Animate with `useCurrentFrame()` to read the current frame, `interpolate()` to map frame ranges to value ranges, and `spring()` for physical, settling motion.
- Sequence timing with `<Sequence from={...} durationInFrames={...}>` — never `setTimeout`, `setInterval`, or `requestAnimationFrame`.
- **Never** use CSS transitions, CSS `animation` / `@keyframes`, or Tailwind animation utility classes (`animate-*`, `transition-*`) for anything that must appear in the rendered video. These run on wall-clock time in a live browser and do not exist frame-accurately during Remotion's server-side render — they will look wrong or be entirely absent in the output.
- It's fine to use Tailwind for static layout/spacing/color classes — the rule only applies to motion/timing.
- Derive all opacity/position/scale/rotation values from `interpolate(frame, [inputRange], [outputRange], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })` or `spring({ frame, fps, config })`, then apply them via inline `style` (e.g. `style={{ opacity, transform: \`translateY(${y}px)\` }}`).
- Get `fps` from `useVideoConfig()`, not a hardcoded constant.

## Workflow

1. Understand the video goal (social clip, podcast, data story, product intro).
2. Pick a flagship composition from https://remotionui.com/ai/components.json
3. Run `npx remotion-ui doctor` if setup looks broken.
4. Install: `npx remotion-ui add <name>`
5. Import from local source paths and compose in `Root.tsx`.
6. Customize copied source for brand, timing, and layout — following the animation rules above.

## Agent indexes

- Components: https://remotionui.com/ai/components.json
- Per-component detail: https://remotionui.com/ai/components/<name>.json
- Full guide: https://remotionui.com/ai/remotionui-agent.md
- Registry: https://remotionui.com/r/index.json

## CLI (agent-friendly)

```bash
npx remotion-ui init --existing          # bootstrap remotion-ui.json
npx remotion-ui doctor --json            # diagnose setup
npx remotion-ui search -q caption --json
npx remotion-ui view social-clip --json
npx remotion-ui list --json
npx remotion-ui add social-clip caption-highlight
```

## Existing Remotion projects

```bash
cd your-remotion-project
npx remotion-ui init --existing
npx remotion-ui add social-clip
npm run dev
```

## Composition-first defaults

| Goal | Flagship composition |
|------|----------------------|
| 9:16 social clip | `social-clip` |
| Creator reel | `creator-reel` |
| Podcast clip | `podcast-clip` |
| Data explainer | `data-story` |
| Product launch | `intro` |
