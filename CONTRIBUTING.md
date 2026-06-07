# Contributing

Thanks for your interest in RemotionUI.

## Development setup

```bash
git clone https://github.com/riaz37/remotionui.git
cd remotionui
pnpm install
pnpm skills:sync   # optional: vendor Remotion agent skills
pnpm dev
```

Docs site: `http://localhost:3000` (via `pnpm --filter web dev` or root `pnpm dev`).

## What to work on

- **Registry components** — `apps/web/registry/bases/default/`
- **CLI** — `packages/remotion-ui/`
- **Docs** — `apps/web/content/docs/` and `apps/web/components/`

Browse [open issues](https://github.com/riaz37/remotionui/issues) or open a feature request first for larger changes.

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
