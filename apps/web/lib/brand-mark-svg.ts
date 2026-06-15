/**
 * Edit Bay brand mark — single SVG source for favicons, OG, and demo assets.
 * Colors match STUDIO-DESIGN.md / brand-tokens.ts.
 */
export const BRAND_COLORS = {
  surfaceRaised: "#2a2928",
  stage: "#050505",
  ink: "#ececec",
  phosphor: "#e8b86d",
  bg: "#1f1e1d",
  muted: "#949494",
} as const;

/** 32×32 app icon / favicon mark */
export const BRAND_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
  <rect width="32" height="32" rx="6" fill="${BRAND_COLORS.surfaceRaised}"/>
  <g transform="translate(-1.5 -1)">
    <rect x="5" y="6" width="18" height="13" rx="3" stroke="${BRAND_COLORS.ink}" stroke-width="1.25" fill="none" opacity="0.35"/>
    <rect x="9" y="10" width="18" height="13" rx="3" fill="${BRAND_COLORS.stage}" stroke="${BRAND_COLORS.ink}" stroke-width="1.5" opacity="0.95"/>
    <path d="M15.5 14.5v5l4.5-2.5-4.5-2.5z" fill="${BRAND_COLORS.phosphor}"/>
  </g>
</svg>`;

/** 1200×630 Open Graph card */
export const BRAND_OG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
  <rect width="1200" height="630" fill="${BRAND_COLORS.bg}"/>
  <rect x="0" y="626" width="1200" height="4" fill="${BRAND_COLORS.phosphor}"/>
  <g transform="translate(80 175) scale(4)">
    <rect width="32" height="32" rx="6" fill="${BRAND_COLORS.surfaceRaised}"/>
    <g transform="translate(-1.5 -1)">
      <rect x="5" y="6" width="18" height="13" rx="3" stroke="${BRAND_COLORS.ink}" stroke-width="1.25" fill="none" opacity="0.35"/>
      <rect x="9" y="10" width="18" height="13" rx="3" fill="${BRAND_COLORS.stage}" stroke="${BRAND_COLORS.ink}" stroke-width="1.5" opacity="0.95"/>
      <path d="M15.5 14.5v5l4.5-2.5-4.5-2.5z" fill="${BRAND_COLORS.phosphor}"/>
    </g>
  </g>
  <text x="280" y="280" font-family="Georgia, 'Times New Roman', serif" font-size="88" font-weight="500" fill="${BRAND_COLORS.ink}">RemotionUI</text>
  <text x="280" y="350" font-family="Georgia, 'Times New Roman', serif" font-size="36" font-weight="400" fill="${BRAND_COLORS.muted}">Production-ready motion for Remotion.</text>
  <text x="280" y="410" font-family="ui-monospace, Menlo, monospace" font-size="22" fill="${BRAND_COLORS.phosphor}">remotion-ui · source you own</text>
</svg>`;

export function brandMarkDataUrl(): string {
  return `data:image/svg+xml,${encodeURIComponent(BRAND_MARK_SVG)}`;
}
