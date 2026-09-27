import { COLORS } from "../theme";

/**
 * Mark: the RemotionUI logo, the same geometry and colours as
 * apps/web/public/logo.svg (plate, back frame, front frame, phosphor play).
 */
export const Mark: React.FC<{ size: number; glow?: number }> = ({ size, glow = 0 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    style={{
      display: "block",
      filter: glow > 0.01 ? `drop-shadow(0 0 ${(glow * size * 0.25).toFixed(1)}px rgba(${COLORS.phosphorRgb},${(0.55 * glow).toFixed(3)}))` : undefined,
    }}
  >
    <rect width="32" height="32" rx="6" fill={COLORS.plate} />
    <g transform="translate(-1.5 -1)">
      <rect x="5" y="6" width="18" height="13" rx="3" stroke={COLORS.ink} strokeWidth="1.25" fill="none" opacity="0.35" />
      <rect x="9" y="10" width="18" height="13" rx="3" fill={COLORS.stage} stroke={COLORS.ink} strokeWidth="1.5" opacity="0.95" />
      <path d="M15.5 14.5v5l4.5-2.5-4.5-2.5z" fill={COLORS.phosphor} />
    </g>
  </svg>
);
