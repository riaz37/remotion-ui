---
name: remotion-ui
description: >-
  Work with the RemotionUI monorepo — registry authoring, CLI commands,
  remotion-ui.json config, and copy-paste component distribution.
  Use when adding primitives/scenes/compositions or running remotion-ui CLI.
metadata:
  tags: remotion-ui, registry, cli, components
---

# RemotionUI

Use this skill when working with the RemotionUI monorepo or helping users add Remotion video components.

For Remotion framework best practices, read in order:

1. **[skills/remotion/docs/INDEX.md](../remotion/docs/INDEX.md)** — mirrored official remotion.dev docs (`pnpm docs:remotion` to refresh)
2. **[skills/remotion/SKILL.md](../remotion/SKILL.md)** — Remotion skill + conventions
3. **[skills/remotion/rules/video-layout.md](../remotion/rules/video-layout.md)** — prevent overlapping layouts

## When to use

- Adding or authoring registry components
- Working with the `remotion-ui` CLI
- Understanding the copy-paste distribution model
- Patching `Root.tsx` or `remotion.config.ts` during installs

## Key paths

- Registry source: `apps/web/registry/`
- Registry manifest: `apps/web/registry.json`
- Built registry: `apps/web/public/r/`
- CLI package: `packages/remotion-ui/`
- User config: `remotion-ui.json`

## Commands

```bash
pnpm skills:sync             # Sync Remotion skills + wire Codex
pnpm registry:build          # Build registry JSON
pnpm dev                     # Start docs site
pnpm build                   # Build all packages
```

## Reference docs

- [CLI commands](cli.md)
- [Registry authoring](registry.md)
- [Composition install rules](rules/composition.md)
- [RemotionUI preset timing](rules/timing.md)

## Philosophy

Components are **not** published as npm packages. Only the CLI (`remotion-ui`) is published. Users copy source files into their projects.
