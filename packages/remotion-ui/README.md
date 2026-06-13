# remotion-ui

Production-ready motion for Remotion. Source you own.

CLI for adding Remotion video components to your project, not a runtime dependency.

> Same registry workflow as [shadcn/ui](https://ui.shadcn.com): `npx add`, JSON manifest, files in your repo.

## Quick start

```bash
npx remotion-ui@latest init my-video
cd my-video
npx remotion-ui@latest add fade-in
npx remotion-ui@latest add intro
```

Components are installed into your project as source files. You own the code.

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

## Configuration

Create `remotion-ui.json` in your project root (included by `init`):

```json
{
  "preset": "default",
  "aliases": {
    "primitives": "@/remotion/primitives",
    "scenes": "@/remotion/scenes",
    "compositions": "@/compositions",
    "lib": "@/remotion/lib",
    "hooks": "@/remotion/hooks"
  }
}
```

## Programmatic API

```ts
import { fetchRegistryItem } from "remotion-ui/registry";
import { remotionUiConfigSchema } from "remotion-ui/schema";
```

## Publishing (maintainers)

```bash
pnpm publish:cli
```

Requires `NPM_TOKEN` in the repo root `.env`.
