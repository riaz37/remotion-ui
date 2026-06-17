# Registry Component Polish

Mandatory guide for elevating registry components to production-grade motion. Read before any registry source edit.

## Remotion docs-first gate

Before editing registry source, read in order:

1. `skills/remotion/docs/INDEX.md`
2. `skills/remotion/SKILL.md`
3. `skills/remotion/rules/video-layout.md`
4. `skills/remotion-ui/SKILL.md` + `registry.md`

Then read category-specific rules from the table below.

| Category | Mirrored docs | Skill rules |
|----------|---------------|-------------|
| Motion primitives | animating-properties, interpolate, spring, easing, use-current-frame | timing.md |
| Text primitives | + sequence | text-animations.md |
| Transitions | transitions-transitionseries, transitions | transitions.md, light-leaks.md |
| High-polish transitions | effects docs | effects.md |
| Text-heavy scenes | layout-utils | measuring-text.md |
| Media scenes | media-utils | images.md, videos.md |
| Captions | captions | subtitles.md, display-captions.md |
| Audio viz | — | audio-visualization.md |
| Maps | — | maplibre.md |
| Compositions | series, transitions-transitionseries | compositions.md, sequencing.md |
| Paths / logo | paths | path-utils |

Refresh mirror: `pnpm docs:remotion`

## Remotion-native patterns (enforce)

| Wrong | Correct |
|-------|---------|
| CSS transition / @keyframes / Tailwind animate | `useCurrentFrame()` + `interpolate()` / `spring()` with clamp |
| Per-char opacity typewriter | String slicing |
| Stagger via absolute offsets | `<Sequence from={…} layout="none">` |
| `AbsoluteFill` on list items | Flex/grid for content; `AbsoluteFill` for full-frame only |
| Guessed font size | `fitText()` / `measureText()` or `text-fit-utils` |
| CSS fake transitions in previews | Real `TransitionSeries` |
| Linear interpolate everywhere | Bézier enter `bezier(0.16, 1, 0.3, 1)`, exit ease-in |

## Polish rubric

| Dimension | Rule |
|-----------|------|
| Remotion API | Frame-driven motion only; still-frame verify |
| Layout | Flex/grid slots; `getSafeAreaPadding()`; `fitText()` when length varies |
| Motion | Shared tokens; layered beats via Sequence stagger; springs for emphasis |
| Typography | `scaleFont()`; headline ≥84px @1080; measure before placing |
| Copy | Story-specific; no tagline-as-hook |
| Visual | Curated accent palette; no uppercase tracking kickers |

## Content placement rules

1. Readable content never uses raw `top`/`left`/`bottom`/`right` — flex/grid inside safe area.
2. Safe area mandatory on every scene root via `getSafeAreaPadding()`.
3. Assume user copy wraps — test at 2× default length.
4. One focal slot per beat — headline, support, CTA in vertical column with `gap`.
5. Aspect matrix: 960×540, 1920×1080, 1080×1920 (portrait scenes).
6. `overflow: hidden` only on media/decoration layers, not text parents.
7. Use `clampRectToSafeArea()` for coordinate props (spotlight targets, etc.).

## Demo palette (installers may override)

| Lane | Hex | Use |
|------|-----|-----|
| Phosphor | `#e8b86d` | Primary accent, hooks |
| Amber | `#f59e0b` | Features, warmth |
| Teal | `#2dd4bf` | Stats, data |
| Rose | `#f472b6` | Quotes, social |
| Neutral bg | `#080810` | Scene backgrounds |

## Verification

```bash
npx remotion still [composition-id] --scale=0.25 --frame=[enter|hold|exit]
pnpm registry:build
pnpm --filter web build
```

Per-component checklist:

- [ ] Remotion docs gate passed
- [ ] No content cropped at enter/hold/exit
- [ ] Long-copy stress test (2× strings)
- [ ] Portrait verified where applicable
- [ ] ≥2 layered animation beats on scenes
- [ ] Preview matches installed source
