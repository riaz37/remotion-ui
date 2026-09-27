import type { CSSProperties } from "react";
import { COLORS } from "../theme";

/**
 * icons.tsx — the handful of line icons the panels use.
 *
 * Drawn on a 24-unit grid with round joins, the same construction as the
 * dashboard's icon set. Pure geometry: no letterforms.
 */

type IconProps = { size?: number; color?: string; style?: CSSProperties; strokeWidth?: number };

const Frame: React.FC<IconProps & { children: React.ReactNode }> = ({
  size = 24,
  color = COLORS.muted,
  style,
  strokeWidth = 2,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}
  >
    {children}
  </svg>
);

export const TableIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18M9 10v10" />
  </Frame>
);

export const DatabaseIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <ellipse cx="12" cy="5.5" rx="8" ry="3" />
    <path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13" />
    <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
  </Frame>
);

export const LockIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Frame>
);

export const PulseIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <path d="M3 12h4l3-8 4 16 3-8h4" />
  </Frame>
);

export const FolderIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Frame>
);

export const BoltIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
  </Frame>
);

export const SparkIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
  </Frame>
);

export const SearchIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Frame>
);

export const PlayIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <path d="M7 5v14l11-7z" fill={p.color ?? COLORS.muted} />
  </Frame>
);

export const CheckIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Frame>
);

export const MailIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
  </Frame>
);

export const FileIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </Frame>
);

export const FilterIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <path d="M4 5h16l-6 8v6l-4-2v-4z" />
  </Frame>
);

export const SortIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4" />
  </Frame>
);

export const PlusIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <path d="M12 5v14M5 12h14" />
  </Frame>
);

export const TerminalIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <path d="m5 8 4 4-4 4M12 16h7" />
  </Frame>
);

export const GlobeIcon: React.FC<IconProps> = (p) => (
  <Frame {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
  </Frame>
);

/** Octicons "mark-github", 16-unit grid. Verified against a render. */
export const GitHubMark: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = COLORS.text,
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <path
      fill={color}
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
    />
  </svg>
);

/**
 * A four-colour "G" ring for the Google button, built from arcs rather than a
 * traced glyph: four stroked quarter-segments and the crossbar.
 */
export const GoogleMark: React.FC<{ size?: number }> = ({ size = 24 }) => {
  const r = 8;
  const c = 12;
  const pt = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${c + r * Math.cos(a)} ${c + r * Math.sin(a)}`;
  };
  const arc = (from: number, to: number) => `M ${pt(from)} A ${r} ${r} 0 0 1 ${pt(to)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth={3.4} style={{ flexShrink: 0 }}>
      <path d={arc(0, 48)} stroke="#4285F4" />
      <path d={arc(48, 135)} stroke="#34A853" />
      <path d={arc(135, 215)} stroke="#FBBC05" />
      <path d={arc(215, 318)} stroke="#EA4335" />
      <path d={`M 12.4 12 H ${c + r + 1.7}`} stroke="#4285F4" />
    </svg>
  );
};
