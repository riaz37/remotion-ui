# RemotionUI Composition Install Rules

For Remotion composition basics (`<Composition>`, `durationInFrames`, `fps`), use the official skill: [skills/remotion/rules/compositions.md](../../remotion/rules/compositions.md).

This file covers **RemotionUI CLI install behavior** only.

## Root.tsx registration

When a user adds a `registry:block` composition via `remotion-ui add`, the CLI should:

1. Copy composition source files to the user's `compositions/` alias path
2. Add a `<Composition>` entry in `Root.tsx`
3. Import the composition component

## Composition entry pattern

```tsx
<Composition
  id="ProductLaunch"
  component={ProductLaunch}
  durationInFrames={300}
  fps={30}
  width={1920}
  height={1080}
/>
```

## Guidelines

- Never overwrite existing compositions without user confirmation
- Preserve existing imports and formatting in `Root.tsx`
- Use the `remotion.root` path from `remotion-ui.json`
