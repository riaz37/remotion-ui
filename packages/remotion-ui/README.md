> If RemotionUI saves you time, please ⭐ star the repo — it helps a lot!

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

Run the full preflight before tagging or publishing:

```bash
pnpm prepare:publish
```

Then deploy [remotionui.com](https://remotionui.com) so the hosted registry is live, tag `v0.x.x`, and publish:

```bash
pnpm publish:cli
```

Requires npm auth (`NPM_TOKEN` in `.env` or GitHub Actions `npm-publish` environment).
