# Remotion official docs mirror

Last updated: **2026-06-07**

Fetched from [remotion-dev/remotion](https://github.com/remotion-dev/remotion) `packages/docs/docs/*.mdx` — the same source that powers [remotion.dev/docs](https://www.remotion.dev/docs).

Refresh: `pnpm docs:remotion`

| Topic | Local file | Live docs |
|-------|------------|-----------|
| sequence | [sequence.md](./sequence.md) | [https://www.remotion.dev/docs/sequence](https://www.remotion.dev/docs/sequence) |
| absolute-fill | [absolute-fill.md](./absolute-fill.md) | [https://www.remotion.dev/docs/absolute-fill](https://www.remotion.dev/docs/absolute-fill) |
| animating-properties | [animating-properties.md](./animating-properties.md) | [https://www.remotion.dev/docs/animating-properties](https://www.remotion.dev/docs/animating-properties) |
| interpolate | [interpolate.md](./interpolate.md) | [https://www.remotion.dev/docs/interpolate](https://www.remotion.dev/docs/interpolate) |
| use-current-frame | [use-current-frame.md](./use-current-frame.md) | [https://www.remotion.dev/docs/use-current-frame](https://www.remotion.dev/docs/use-current-frame) |
| spring | [spring.md](./spring.md) | [https://www.remotion.dev/docs/spring](https://www.remotion.dev/docs/spring) |
| easing | [easing.md](./easing.md) | [https://www.remotion.dev/docs/easing](https://www.remotion.dev/docs/easing) |
| series | [series.md](./series.md) | [https://www.remotion.dev/docs/series](https://www.remotion.dev/docs/series) |
| player | [player.md](./player.md) | [https://www.remotion.dev/docs/player](https://www.remotion.dev/docs/player) |
| transitions/transitionseries | [transitions-transitionseries.md](./transitions-transitionseries.md) | [https://www.remotion.dev/docs/transitions/transitionseries](https://www.remotion.dev/docs/transitions/transitionseries) |
| transitions | [transitions.md](./transitions.md) | [https://www.remotion.dev/docs/transitions](https://www.remotion.dev/docs/transitions) |

## Rules for RemotionUI components

From official docs + `skills/remotion/rules/`:

1. **Animate with frames** — `useCurrentFrame()` + `interpolate()` / `spring()`. CSS transitions/animations do not render.
2. **`AbsoluteFill`** — full-frame layering only (scenes, backgrounds). Not for wrapping list items.
3. **`Sequence layout="none"`** — stagger inline children without absolute stacking (see `sequence.md`).
4. **`premountFor`** — premount sequences before they play (see `sequence.md`, `series.md`).
5. **`TransitionSeries`** — scene transitions; durations overlap (see `transitions-transitionseries.md`).
6. **Enter = ease-out, exit = ease-in** — see `easing.md` and `skills/remotion/rules/timing.md`.