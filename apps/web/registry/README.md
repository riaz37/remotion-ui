# Registry

Source of truth for all RemotionUI components.

## Structure

```
registry/
├── bases/default/
│   ├── primitives/     # Atomic motion pieces (registry:ui)
│   ├── scenes/         # Reusable scene segments (registry:block)
│   ├── compositions/   # Full video templates (registry:block)
│   ├── lib/            # Utilities — springs, timing, stagger (registry:lib)
│   ├── hooks/          # React hooks (registry:hook)
│   ├── assets/         # Sample media for registry items
│   ├── examples/       # Docs-only demos (registry:example)
│   └── internal/       # Non-installable internals
└── presets/            # Motion/brand presets
    └── tokens/         # Duration, spring, typography defaults
```

## Adding a component

1. Create the source file in the appropriate folder under `bases/default/`
2. Add an entry to `registry.json` at the app root
3. Run `pnpm registry:build` to generate `public/r/*.json`

## Registry item types

| Folder | Type | Install path |
|--------|------|--------------|
| `primitives/` | `registry:ui` | `src/remotion/primitives/` |
| `scenes/` | `registry:block` | `src/remotion/scenes/` |
| `compositions/` | `registry:block` | `src/compositions/` |
| `lib/` | `registry:lib` | `src/remotion/lib/` |
| `hooks/` | `registry:hook` | `src/remotion/hooks/` |
