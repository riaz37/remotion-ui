# RemotionUI

Copy-paste production-ready Remotion video components directly into your projects. Install with the CLI, own every line of source — no black-box runtime dependency.

> Familiar with [shadcn/ui](https://ui.shadcn.com)? RemotionUI uses the same registry workflow: CLI install, JSON manifest, files in your repo.

## Quick start

```bash
npx remotion-ui@latest init my-video
cd my-video
npx remotion-ui@latest add intro
```

Docs: [remotionui.com](https://remotionui.com)

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
