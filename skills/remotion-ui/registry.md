# Registry Authoring Guide

## Item types

| Type | Folder | Install target |
|------|--------|----------------|
| `registry:ui` | `primitives/` | `src/remotion/primitives/` |
| `registry:block` | `scenes/`, `compositions/` | `src/remotion/scenes/` or `src/compositions/` |
| `registry:lib` | `lib/` | `src/remotion/lib/` |
| `registry:hook` | `hooks/` | `src/remotion/hooks/` |
| `registry:example` | `examples/` | Docs only, not installable |
| `registry:internal` | `internal/` | Not installable |

## Adding a new item

1. Create source file(s) under `apps/web/registry/bases/default/`
2. Add entry to `apps/web/registry.json`
3. Run `pnpm registry:build`
4. Verify output in `apps/web/public/r/presets/default/`

## Example manifest entry

```json
{
  "name": "fade-in",
  "type": "registry:ui",
  "dependencies": ["remotion"],
  "registryDependencies": [],
  "files": [
    {
      "path": "registry/bases/default/primitives/fade-in.tsx",
      "type": "registry:ui"
    }
  ]
}
```

## Dependencies

- `dependencies` — npm packages installed via package manager
- `registryDependencies` — other registry items installed first
