<div align="center">

# RemotionUI

<img src="apps/web/public/logo.svg" alt="RemotionUI" width="64" height="64" />

**Production-ready motion for Remotion. Source you own.**

<a href="https://remotionui.com/docs"><img src="https://img.shields.io/badge/docs-remotionui.com-60a5fa?style=flat-square" alt="Docs" /></a>
&nbsp;
<a href="https://www.npmjs.com/package/remotion-ui"><img src="https://img.shields.io/npm/v/remotion-ui?style=flat-square" alt="npm version" /></a>
&nbsp;
<a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="MIT License" /></a>

</div>

## Quick start

```bash
npx remotion-ui@latest init my-video
cd my-video
npx remotion-ui@latest add social-clip
```

Production-ready motion for Remotion. Source you own. Docs: [remotionui.com](https://remotionui.com)

## What you get

- **120+ components**: primitives, scenes, compositions (captions, charts, AI composers, social clips, creator reels)
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
├── skills/                # Agent skills (vendored Remotion + RemotionUI-authored)
└── scripts/               # Repo maintenance scripts
```

## Philosophy

- **Registry-first**: Component source lives in `apps/web/registry/`
- **CLI distribution**: Users run `npx remotion-ui add <component>`
- **Source you own**: Components install as source files in your repo
- **Only the CLI is published**: No `@remotionui/primitives` npm package

## Getting Started (development)

```bash
pnpm install
pnpm skills:sync    # Pull Remotion Agent Skills + wire Codex/Claude Code
pnpm dev
```

### Agent Skills

RemotionUI uses [Agent Skills](https://agentskills.io/home) to give AI agents domain expertise:

| Skill | Location | Purpose |
|-------|----------|---------|
| `remotion-best-practices` + 11 more | `skills/remotion/<skill>/` | Official [Remotion Agent Skills](https://www.remotion.dev/docs/ai/skills), vendored from upstream |
| `remotion-ui` | `skills/remotion-ui/` | RemotionUI monorepo, CLI, and registry authoring |
| `remotionui-agent` | `skills/remotionui-agent/` | Building full compositions with RemotionUI recipes |

Upstream ships focused skills (`remotion-markup`, `remotion-captions`, `remotion-create`, `remotion-maps`, `remotion-render`, …) with `remotion-best-practices` as the router. `skills/remotion/docs/` is a RemotionUI-maintained mirror of the official docs MDX, refreshed with `pnpm docs:remotion`.

Run `pnpm skills:sync` to vendor the latest skills from upstream and link every skill into `.agents/skills/` (Codex) and `.claude/skills/` (Claude Code).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm registry:build` | Build registry JSON for CLI consumption |
| `pnpm skills:sync` | Sync Remotion Agent Skills and wire Codex + Claude Code |
| `pnpm prepare:publish` | Preflight: build, test, registry count, npm dry-run |
| `pnpm publish:cli` | Publish `remotion-ui` to npm (requires auth) |

## License

MIT
