# Edit Bay — Studio Design System

Source of truth for RemotionUI docs and landing UI. See [IDENTITY.md](./IDENTITY.md) for voice and copy.

## Concept

RemotionUI docs feel like an offline edit room: timeline, monitor, bins, inspector. Dark, editorial, composition-first.

## Color tokens

| Token | CSS variable | Dark value | Use |
|-------|--------------|------------|-----|
| Background | `--bay-bg` | `oklch(0.12 0.004 75)` | Page shell |
| Surface | `--bay-surface` | `oklch(0.15 0.005 75)` | Cards, sidebar |
| Surface raised | `--bay-surface-raised` | `oklch(0.18 0.006 75)` | Command blocks |
| Stage | `--bay-stage` | `#050505` | Player monitor |
| Ink | `--bay-ink` | `oklch(0.93 0.005 75)` | Primary text |
| Muted | `--bay-muted` | `oklch(0.58 0.01 75)` | Secondary text |
| Border | `--bay-border` | `oklch(1 0 0 / 0.07)` | Hairline |
| Border strong | `--bay-border-strong` | `oklch(1 0 0 / 0.12)` | Panel headers |
| Phosphor | `--bay-phosphor` | `oklch(0.78 0.12 75)` | Playhead, focus, active underline |
| Record | `--bay-record` | `oklch(0.62 0.2 25)` | Live dot (sparing) |

Fumadocs `--color-fd-*` maps to bay tokens in `.dark`. No blue primary.

## Typography

| Token | Font | Size | Weight |
|-------|------|------|--------|
| display-xl | Newsreader | clamp(2.5rem, 5vw, 3.75rem) | 500 |
| display-lg | Newsreader | 2rem | 500 |
| title | IBM Plex Sans | 1.125rem | 600 |
| body | IBM Plex Sans | 0.9375rem | 400 |
| body-sm | IBM Plex Sans | 0.8125rem | 400 |
| mono | JetBrains Mono | 0.8125rem | 400 |
| mono-xs | JetBrains Mono | 0.6875rem | 500 |

## Spacing & radius

- Section gap: 120px (`py-30`)
- Prose max: 680px
- Catalog max: 1120px
- Radius sm/md/lg: 4px / 6px / 8px

## Perforation rule CSS

```css
.perforation-rule {
  height: 12px;
  background-image: radial-gradient(circle, transparent 3px, var(--bay-border) 3px);
  background-size: 24px 12px;
  background-position: center;
  opacity: 0.6;
}
```

## Film grain (landing hero only)

SVG noise overlay at `opacity: 0.025`, `mix-blend-mode: overlay`.

## Components

### StudioPanel

Monitor chrome: header (composition id, fps, dimensions), `#050505` stage, optional TimecodeBar.

### TimecodeBar

JetBrains Mono tabular. Playhead dot uses `--bay-phosphor`.

### CommandRail

Left border 2px phosphor, `$` prefix, package manager underline tabs.

### ClipCard

4px lane stripe, aspect-ratio thumbnail, title + duration badge. Hover: border brighten only.

### InspectorPanel

Wraps PropsPlayground. Label "Inspector". Bottom-border inputs.

### PerforationRule

Section divider between landing sections.

### FilmstripScroll

Horizontal scroll rail for recipe cards, storyboard clips, and catalog lanes.

- Edge fades (48px) when content overflows left/right
- Prev/next phosphor chevron buttons when scrollable
- Keyboard: focus rail, use arrow keys
- Negative margin breaks out of content column; track padding aligns first card with headline

## Lane color rules

- `laneAccent`: `oklch(0.55 0.06 ${hue})` — stripe and icon only
- Never: card backgrounds, filter chips, preview stage fills

## Anti-slop checklist

- [ ] No blue `#60a5fa` in UI chrome
- [ ] No font-weight ≥ 700 on Newsreader headlines
- [ ] No gradient backgrounds outside player content
- [ ] No glass/backdrop-filter panels
- [ ] No uppercase tracking kickers
- [ ] Player stage always `#050505`
- [ ] Lane color only on 4px stripe or 24px icon
