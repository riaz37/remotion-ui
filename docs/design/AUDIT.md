# RemotionUI Docs — Competitive Design Audit

## Benchmarks reviewed

| Site | Strengths | Weaknesses for our context |
|------|-----------|---------------------------|
| [remotion.dev](https://www.remotion.dev) | Dark studio energy, preview-forward hero, code-as-product | Not a component registry; different IA |
| [ui.shadcn.com](https://ui.shadcn.com) | CLI install blocks, scannable component index, restrained palette | Web UI patterns; orange/warm not video-native |
| [radix-ui.com](https://radix-ui.com) | Typographic hierarchy, minimal chrome | No live previews |
| [fumadocs.vercel.app](https://fumadocs.vercel.app) | Fast docs shell | Default theme reads as template |

## RemotionUI current issues (slop inventory)

| Pattern | Location | Remediation |
|---------|----------|-------------|
| Syne + IBM Plex | `layout.tsx` | Outfit display + Plex body + JetBrains Mono |
| Orange primary + radial hero glow | `globals.css`, `page.tsx` | Cool studio blue; remove decorative gradient |
| Duplicate homepage grids | `page.tsx` | Atlas-only browse |
| Fake window chrome on previews | `preview-panel.tsx` | Clean frame, “Live preview” label |
| Letter-in-square logo | `site-logo.tsx` | SVG frame mark (programmatic video) |
| Uppercase tracking labels everywhere | install/preview panels | Sentence case, typographic hierarchy |
| Text-only component cards | homepage | Lane icon thumbnails |
| Orange site vs blue demos | tokens split | Unified `--brand-accent` |
| Light-default theme | `RootProvider` | `defaultTheme="dark"` |
| 3-column feature cards | homepage | Single “How it works” strip |

## Chosen direction: **Studio Blue**

Remotion-adjacent dark studio with preview as hero. Rejected: (1) warm shadcn clone, (2) neon cyberpunk gradient stack.

See [DESIGN.md](../../DESIGN.md) and [MOCKUPS.md](./MOCKUPS.md).
