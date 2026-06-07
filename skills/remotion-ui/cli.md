# RemotionUI CLI Reference

## Commands

| Command | Description |
|---------|-------------|
| `remotion-ui init [name]` | Scaffold a new Remotion project |
| `remotion-ui add <name...>` | Add component(s) from registry |
| `remotion-ui update <name...>` | Re-install from registry (overwrites files) |
| `remotion-ui diff <name>` | Diff installed vs registry version |
| `remotion-ui search -q <query>` | Search the registry |
| `remotion-ui build [registry.json]` | Build a custom registry |
| `remotion-ui view <name>` | View registry item details |

## User config: remotion-ui.json

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

## Published npm package

Only `remotion-ui` (the CLI) is published. Subpath exports:

- `remotion-ui/schema`
- `remotion-ui/registry`
