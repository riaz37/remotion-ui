---
name: remotionui-agent
description: >-
  Build Remotion videos with RemotionUI: recipes, CLI install workflow,
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
- Prefer recipes: `npx remotion-ui@latest add --recipe captioned-social-video`
- Import from local paths: `@/compositions/...`, `@/remotion/scenes/...`, `@/remotion/primitives/...`
- **Never** import UI components from the `remotion-ui` npm package.
- Animate with `useCurrentFrame()`, `interpolate()`, `spring()`, and `<Sequence />`.
- Do not use CSS transitions or Tailwind animation classes for render-time motion.

## Workflow

1. Understand the video goal (social clip, podcast, data story, product intro).
2. Pick a recipe from https://remotionui.com/ai/recipes.json
3. Run `npx remotion-ui doctor` if setup looks broken.
4. Install: `npx remotion-ui add --recipe <slug>` or `npx remotion-ui add <name>`
5. Import from local source paths and compose in `Root.tsx`.
6. Customize copied source for brand, timing, and layout.

## Agent indexes

- Components: https://remotionui.com/ai/components.json
- Per-component detail: https://remotionui.com/ai/components/<name>.json
- Recipes: https://remotionui.com/ai/recipes.json
- Full guide: https://remotionui.com/ai/remotionui-agent.md
- Registry: https://remotionui.com/r/index.json

## CLI (agent-friendly)

```bash
npx remotion-ui init --existing          # bootstrap remotion-ui.json
npx remotion-ui doctor --json            # diagnose setup
npx remotion-ui search -q caption --json
npx remotion-ui view social-clip --json
npx remotion-ui list --json
npx remotion-ui add --recipe captioned-social-video
```

## Existing Remotion projects

```bash
cd your-remotion-project
npx remotion-ui init --existing
npx remotion-ui add social-clip
npm run dev
```

## Composition-first defaults

| Goal | Recipe | Flagship composition |
|------|--------|----------------------|
| 9:16 social clip | `captioned-social-video` | `social-clip` |
| Creator reel | (none) | `creator-reel` |
| Podcast clip | `podcast-clip` | `podcast-clip` |
| Data explainer | `data-story` | `data-story` |
| Product launch | `product-intro` | `intro` |
