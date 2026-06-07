# RemotionUI Codex Guide

## Repository Purpose

- RemotionUI is a copy-paste component registry for Remotion video projects.
- The CLI is the published product; registry components are installed as source into user projects.
- Treat docs previews, registry metadata, and CLI install behavior as one product surface.

## Required Context Before Component Work

Before adding or changing Remotion registry code, read these in order:

1. `skills/remotion/docs/INDEX.md`
2. `skills/remotion/SKILL.md`
3. `skills/remotion/rules/video-layout.md`
4. `skills/remotion-ui/SKILL.md`
5. `skills/remotion-ui/registry.md`

## Registry Authoring Rules

- Registry source lives in `apps/web/registry/bases/default/`.
- New components require source, `apps/web/registry.json`, docs MDX, preview component, `component-reference.ts`, Atlas metadata, and generated public registry output.
- Run `pnpm registry:build` after registry source or manifest changes.
- Prefer existing registry helpers before adding new abstractions.
- Keep components copy-paste friendly; do not depend on unpublished RemotionUI packages.

## Remotion Rules

- Animate with `useCurrentFrame()`, `interpolate()`, or `spring()`; do not use CSS transitions or Tailwind animation classes for render-time motion.
- Use `AbsoluteFill` for full-frame scenes and backgrounds only.
- Use normal flex/grid layout slots for readable content to prevent overlap.
- Use `<Sequence layout="none">` for inline stagger/timing.
- Use `premountFor` only on full-frame sequences where render-heavy children need preloading.

## Validation

- For registry/docs changes, run `pnpm registry:build` and `pnpm --filter web build` when practical.
- For CLI changes, run `pnpm remotion-ui:test`.
- For visual docs changes, inspect the local docs site and run `pnpm qa:browser` when practical.
