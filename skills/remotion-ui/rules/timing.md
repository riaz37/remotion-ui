# RemotionUI Preset Timing

For Remotion framework timing rules (`interpolate`, `spring`, `Easing`), use the official skill: [skills/remotion/rules/timing.md](../../remotion/rules/timing.md).

This file covers **RemotionUI-specific** motion preset tokens only.

## Preset tokens

Motion presets in `registry/presets/tokens/` define defaults:

- Standard durations (in frames)
- Spring configurations
- Stagger delays
- Easing curves

## Registry metadata

When authoring registry items, document `durationInFrames` requirements in the item's registry.json entry so the CLI and docs can surface them.

## Guidelines

- Reuse preset tokens from `registry/presets/tokens/` rather than hardcoding frame counts
- Keep primitives composable — expose `durationInFrames` as a prop with a sensible preset default
