# Contributing

Thanks for your interest in RemotionUI.

## Development setup

```bash
git clone https://github.com/riaz37/remotion-ui.git
cd remotion-ui
pnpm install
pnpm skills:sync   # optional: vendor Remotion agent skills
pnpm dev
```

Docs site: `http://localhost:3000` (via `pnpm --filter web dev` or root `pnpm dev`).

## Monorepo layout

```
remotion-ui/
├── apps/web/                  # Docs site + component registry host
├── packages/remotion-ui/      # CLI (published to npm)
├── packages/remotion-ui-mcp/  # MCP server exposing the registry as agent tools
├── packages/typescript-config/
├── packages/eslint-config/
├── templates/                 # Starter project scaffolds
├── skills/                    # Agent skills (vendored Remotion + RemotionUI-authored)
└── scripts/                   # Repo maintenance scripts
```

Design principles:

- **Registry-first** — component source lives in `apps/web/registry/`
- **CLI distribution** — users run `npx remotion-ui add <component>`
- **Source you own** — components install as source files in the user's repo
- **Only the CLI is published** — there is no `@remotionui/primitives` npm package

## What to work on

- **Registry components** — `apps/web/registry/bases/default/`
- **CLI** — `packages/remotion-ui/`
- **Docs** — `apps/web/content/docs/` and `apps/web/components/`

Docs site visual design follows [DESIGN.md](DESIGN.md).

Browse [open issues](https://github.com/riaz37/remotion-ui/issues) or open a feature request first for larger changes.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm registry:build` | Build registry JSON for CLI consumption |
| `pnpm skills:sync` | Sync Remotion Agent Skills and wire Codex + Claude Code |
| `pnpm prepare:publish` | Preflight: build, test, registry count, npm dry-run |
| `pnpm publish:cli` | Publish `remotion-ui` to npm (requires auth) |

## Agent skills

RemotionUI uses [Agent Skills](https://agentskills.io/home) to give AI agents domain expertise:

| Skill | Location | Purpose |
|-------|----------|---------|
| `remotion-best-practices` + 11 more | `skills/remotion/<skill>/` | Official [Remotion Agent Skills](https://www.remotion.dev/docs/ai/skills), vendored from upstream |
| `remotion-ui` | `skills/remotion-ui/` | RemotionUI monorepo, CLI, and registry authoring |
| `remotionui-agent` | `skills/remotionui-agent/` | Building full compositions with RemotionUI |

Upstream ships focused skills (`remotion-markup`, `remotion-captions`, `remotion-create`, `remotion-maps`, `remotion-render`, …) with `remotion-best-practices` as the router. `skills/remotion/docs/` is a RemotionUI-maintained mirror of the official docs MDX, refreshed with `pnpm docs:remotion`.

Run `pnpm skills:sync` to vendor the latest skills from upstream and link every skill into `.agents/skills/` (Codex) and `.claude/skills/` (Claude Code).

## Pull requests

1. Branch from `main`
2. Keep changes focused
3. Run before opening a PR:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm --filter remotion-ui test
pnpm --filter web build   # if you touched registry or docs
```

4. If you add or change a registry component, run `pnpm registry:build`

See the [pull request template](.github/pull_request_template.md) when opening a PR.

## Registry authoring

New components need:

1. Source in `apps/web/registry/bases/default/`
2. Entry in `apps/web/registry.json`
3. Preview in `apps/web/components/previews/`
4. MDX page in `apps/web/content/docs/`
5. Metadata in `apps/web/lib/component-reference.ts`

Run `node apps/web/scripts/enrich-component-docs.mjs` to refresh component MDX templates after bulk edits.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
