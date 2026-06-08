# RemotionUI Design System

Registry-first motion components for Remotion. The docs site should feel like a **Remotion Studio extension** — dark, preview-forward, code-literate — not a generic SaaS landing page.

## Brand positioning

RemotionUI is a copy-paste component registry for programmatic video. Developers install source they own; the CLI is the product interface. Visual language: studio workspace, not marketing site.

## Color (OKLCH → Fumadocs `--color-fd-*`)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| background | `oklch(0.98 0.008 265)` | `oklch(0.11 0.022 265)` | Page shell |
| foreground | `oklch(0.22 0.02 265)` | `oklch(0.93 0.01 265)` | Body text |
| card | `oklch(1 0.004 265)` | `oklch(0.14 0.02 265)` | Surfaces |
| primary | `oklch(0.52 0.18 252)` | `oklch(0.68 0.14 252)` | Links, accents |
| muted-foreground | `oklch(0.48 0.02 265)` | `oklch(0.62 0.02 265)` | Secondary text |
| border | `oklch(0.88 0.012 265)` | `oklch(0.24 0.02 265)` | Dividers |

**Brand accent (registry demos):** `#60a5fa` active, `#f8fafc` inactive, `#0c1222` preview stage.

Implemented in [`apps/web/app/globals.css`](apps/web/app/globals.css) and [`apps/web/lib/brand-tokens.ts`](apps/web/lib/brand-tokens.ts).

## Typography

| Role | Font | Weight |
|------|------|--------|
| Display | Outfit | 600–700 |
| Body | IBM Plex Sans | 400–500 |
| Mono | JetBrains Mono | 400 |

Scale: `text-sm` body, `text-lg` lead, `text-4xl`–`5xl` hero. Headings: `-0.025em` tracking.

## Spacing & radius

- Container: `max-w-6xl`, `px-6`
- Section rhythm: `py-16` / `py-20`
- Radius: `rounded-lg` UI, `rounded-xl` cards, `rounded-2xl` hero player only
- Elevation: border-first; `shadow-sm` on hover only

## Motion

- UI transitions: `150–220ms`, `ease-out`
- Hover: border-color + subtle translate (`-translate-y-px`)
- No bounce, no parallax, no gradient text
- Live Remotion Player handles product motion

## Docs UI components

### Logo mark

SVG “frame” — rounded rect with play-triangle cutout. See [`apps/web/components/logo-mark.tsx`](apps/web/components/logo-mark.tsx).

### Preview panel

No fake window dots. Label: “Live preview”. Stage: `#0c1222`. On component pages `lg+`: sticky right column.

### Install block

Shared chrome with preview: top bar with label + copy, mono command body.

### Component card

Lane icon thumbnail (48×48), name, optional description, tier dot for advanced.

### Lane colors

| Lane | Hue |
|------|-----|
| atoms | `252` blue |
| signals | `285` violet |
| vectors | `195` cyan |
| spatial | `155` teal |
| blocks | `48` amber |
| cuts | `25` orange |
| reels | `330` pink |

## Slop remediation checklist

- [x] Remove Syne font
- [x] Remove orange primary / hero radial glow
- [x] Single Atlas browse on homepage
- [x] Unified blue accent
- [x] Dark default theme
- [x] Lane thumbnails on cards
- [x] Sticky component preview layout

## References
