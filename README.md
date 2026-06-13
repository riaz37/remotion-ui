# RemotionUI

<p align="center">
  <img src="apps/web/public/logo.svg" alt="RemotionUI" width="64" height="64" />
</p>

<p align="center">
  <strong>Production-ready motion for Remotion. Source you own.</strong>
</p>

<p align="center">
  Full compositions: social clips, creator reels, launch scenes, not just effects.<br />
  Install with <code>npx remotion-ui add</code>, edit every frame in your repo.
</p>

[![Docs](https://img.shields.io/badge/docs-remotionui.com-60a5fa?style=flat-square)](https://remotionui.com/docs)
[![npm](https://img.shields.io/npm/v/remotion-ui?style=flat-square)](https://www.npmjs.com/package/remotion-ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

## Quick start

```bash
npx remotion-ui@latest init my-video
cd my-video
npx remotion-ui@latest add social-clip
```

Same copy-paste workflow as [shadcn/ui](https://ui.shadcn.com), built for Remotion with a dedicated CLI and agent indexes.

Docs: [remotionui.com](https://remotionui.com)

## What you get

- **60+ components**: primitives, scenes, compositions (captions, charts, social clips, creator reels)
- **Source you own**: components land in your repo; edit every frame
- **CLI workflow**: `init`, `add`, `doctor`, `search`, `diff`, `update`, `list`
- **AI-ready**: [agent index](https://remotionui.com/ai/components.json), [recipes](https://remotionui.com/ai/recipes.json), [llms.txt](https://remotionui.com/llms.txt)

## Monorepo Structure

```
remotionui/
├── apps/web/              # Docs site + component registry host
├── packages/remotion-ui/  # CLI (published to npm)
├── packages/typescript-config/
├── packages/eslint-config/
├── templates/             # Starter project scaffolds
├── skills/remotion-ui/    # Agent skill documentation
└── scripts/               # Repo maintenance scripts
```

## Philosophy

- **Registry-first**: Component source lives in `apps/web/registry/`
- **CLI distribution**: Users run `npx remotion-ui add <component>`
- **Copy-paste, not import**: Components land as source files in the user's project
- **Only the CLI is published**: No `@remotionui/primitives` npm package

## Getting Started (development)

```bash
pnpm install
pnpm skills:sync    # Pull Remotion Agent Skills + wire Codex
pnpm dev
```

### Agent Skills

RemotionUI uses [Agent Skills](https://agentskills.io/home) to give AI agents domain expertise:

| Skill | Location | Purpose |
|-------|----------|---------|
| `remotion` | `skills/remotion/` | Official [Remotion best practices](https://www.remotion.dev/docs/ai/skills) |
| `remotion-ui` | `skills/remotion-ui/` | RemotionUI monorepo, CLI, and registry authoring |

Run `pnpm skills:sync` to vendor the latest Remotion skills from upstream and link them to `.agents/skills/` for Codex discovery.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm registry:build` | Build registry JSON for CLI consumption |
| `pnpm skills:sync` | Sync Remotion Agent Skills and wire Codex |
| `pnpm lint` | Lint all packages |

## License

MIT
