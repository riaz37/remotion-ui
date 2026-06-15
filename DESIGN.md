# RemotionUI Design System

Registry-first motion components for Remotion. The docs site uses the **Edit Bay** identity — dark studio, preview-forward, code-literate.

## Documents

- **[STUDIO-DESIGN.md](./STUDIO-DESIGN.md)** — tokens, typography, components, anti-slop rules
- **[IDENTITY.md](./IDENTITY.md)** — voice, landing copy, remocn differentiation

## Quick reference

| Role | Font |
|------|------|
| Display | Newsreader 500 |
| Body | IBM Plex Sans |
| Mono | JetBrains Mono |

| Token | Value |
|-------|-------|
| Stage | `#050505` |
| Phosphor accent | `oklch(0.78 0.12 75)` |
| Shell | `oklch(0.12 0.004 75)` |

## Implementation

- Tokens: [`apps/web/app/globals.css`](apps/web/app/globals.css)
- TS exports: [`apps/web/lib/brand-tokens.ts`](apps/web/lib/brand-tokens.ts)
- Studio components: [`apps/web/components/studio/`](apps/web/components/studio/)
- Logo: [`apps/web/components/logo-mark.tsx`](apps/web/components/logo-mark.tsx)

## Registry demos

Per-component art direction in registry source — local `COLORS` per component, not a shared theme file. Docs previews use neutral `#050505` stage.

## Brand assets

| Asset | Source |
|-------|--------|
| Mark SVG | [`lib/brand-mark-svg.ts`](apps/web/lib/brand-mark-svg.ts) |
| Favicon / app icon | [`app/icon.tsx`](apps/web/app/icon.tsx) |
| Apple touch icon | [`app/apple-icon.tsx`](apps/web/app/apple-icon.tsx) |
| OG / Twitter | [`app/opengraph-image.tsx`](apps/web/app/opengraph-image.tsx) |
| Public PNGs | `pnpm --filter web brand:generate` → `public/logo.svg`, `icon-512.png`, `apple-icon.png`, `og.png` |

Mark colors: surface `#2a2928`, stage `#050505`, ink `#ececec`, phosphor `#e8b86d`.
