# remotion-ui

CLI for adding Remotion video components to your project — the [shadcn/ui](https://ui.shadcn.com) of Remotion.

## Quick start

```bash
npx remotion-ui@latest init my-video
cd my-video
npx remotion-ui@latest add fade-in
npx remotion-ui@latest add intro
```

Components are copied into your project as source files. You own the code.

## Commands

| Command | Description |
|---------|-------------|
| `remotion-ui init [name]` | Scaffold a new Remotion project |
| `remotion-ui add <name>` | Add component(s) from the registry |
| `remotion-ui search -q <query>` | Search the registry |
| `remotion-ui view <name>` | View registry item metadata |
| `remotion-ui diff <name>` | Diff installed vs registry |
| `remotion-ui update <name>` | Re-install from registry |
| `remotion-ui build [registry.json]` | Build a custom registry |

## Publishing (maintainers)

From the monorepo root, with a granular npm token (read/write + bypass 2FA):

```bash
cp .env.example .env   # add NPM_TOKEN=...
pnpm publish:cli
```

Or in GitHub Actions: add `NPM_TOKEN` as a repo secret and run the **Publish CLI** workflow.

## Configuration

Create `remotion-ui.json` in your project root (included by `init`):

```json
{
  "preset": "default",
  "aliases": {
    "primitives": "@/remotion/primitives",
    "scenes": "@/remotion/scenes",
    "compositions": "@/compositions",
    "lib": "@/remotion/lib"
  }
}
```

## Registry

Default registry: `https://remotionui.com/r`

Override with `--registry-url` or `REMOTION_UI_REGISTRY_URL`.

## Programmatic API

```ts
import { fetchRegistryItem } from "remotion-ui/registry";
import { remotionUiConfigSchema } from "remotion-ui/schema";
```

## Docs

https://remotionui.com/docs
