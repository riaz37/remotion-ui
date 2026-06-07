# remotion-ui

CLI for adding Remotion video components to your project.

## Development

```bash
pnpm build
node dist/index.js --help
```

## Commands

- `remotion-ui init` — Scaffold a new Remotion project (stub)
- `remotion-ui add <component>` — Add components from the registry
- `remotion-ui add fade-in -r ./apps/web/public/r` — Use a local registry path
- `remotion-ui search -q <query>` — Search the registry (stub)
- `remotion-ui build [registry.json]` — Build a custom registry (stub)

Set `REMOTION_UI_REGISTRY_URL` to override the default registry base URL.

## Published exports

- `remotion-ui` — CLI binary
- `remotion-ui/schema` — Zod schemas for `remotion-ui.json` and registry items
- `remotion-ui/registry` — Registry fetch utilities
