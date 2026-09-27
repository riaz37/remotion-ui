import { staticFile } from "remotion";

/**
 * captures.ts: the real remotionui.com pages and where things are on them.
 *
 * Every PNG in public/remotionui-launch/captures was taken with gstack browse
 * on 2026-09-27 at a 1920×1080 CSS viewport, device scale 2 (3840×2160), after
 * dismissing the promo banner and the Kine popup and hiding fixed overlays.
 * Every rect below is viewport CSS px read with getBoundingClientRect in the
 * same session (raw JSON beside the PNGs). Never eyeballed.
 */

export type Rect = { x: number; y: number; w: number; h: number };

const DIR = "remotionui-launch/captures";

export const CAPTURE = {
  hero: "home-hero-copy.png",
  docs: "intro-docs.png",
  docsCopied: "intro-docs-copied.png",
  gallery: "gallery.png",
} as const;

export type CaptureId = keyof typeof CAPTURE;
export const captureSrc = (id: CaptureId): string => staticFile(`${DIR}/${CAPTURE[id]}`);

const r = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

/**
 * Homepage hero, the copy layer only (home-hero-copy.png, home-hero-copy.rects.json).
 *
 * Taken at scrollY 0, where the hero's scroll progress is 0 (the stage is
 * sticky and scroll-reactive, so any scroll changes the picture). The monitor
 * (.program-shell: poster + Player) was hidden before the shot, because the
 * film renders hero-loop live in its rect. The page's light field is NOT in
 * this PNG: it is WebGL2, which the headless capture browser lacks, so the
 * film renders the site's own shaders instead (world/PhosphorField.tsx).
 */
export const HERO_RECTS = {
  /** "Production-ready motion", the text line (Range rect). */
  headline: r(714.7, 149, 490.6, 56),
  /** The handwritten "for Remotion." SVG. */
  handwritten: r(752, 207.7, 416, 111.4),
  sub: r(742.7, 335.1, 434.6, 48.8),
  initBox: r(724.2, 411.8, 305.3, 50),
  initCopy: r(984.4, 420.8, 32, 32),
  browse: r(1053.4, 414.8, 142.4, 44),
  /** The homepage's Remotion Player (hero-loop, transparent). Runs past the fold. */
  player: r(422.4, 536.8, 1075.2, 604.8),
  /** The PhosphorField canvas: the sticky stage below the 56 px header. */
  field: r(0, 56, 1920, 1023),
} as const;

/** /docs/components/intro (intro-docs.rects.json, intro-docs-copied.rects.json). */
export const DOCS_RECTS = {
  title: r(542, 92, 615.7, 35.2),
  code: r(559, 303.2, 802, 25.1),
  copy: r(1289.1, 252.2, 71.9, 26),
  copied: r(1278, 252.2, 83, 26),
  player: r(823, 403.3, 554, 311.6),
} as const;

/** /docs/components/browse (gallery.rects.json, gallery.logo.rects.json). */
export const GALLERY_RECTS = {
  title: r(542, 56, 615.7, 35.2),
  /** "210 installable components grouped by motion role: …" */
  count: r(542, 207.2, 836, 113.8),
  logoMark: r(199, 16, 32, 32),
  logoLink: r(199, 16, 130, 32),
} as const;

export const centre = (rect: Rect) => ({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 });
