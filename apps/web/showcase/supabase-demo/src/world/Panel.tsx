import type { CSSProperties, ReactNode } from "react";
import { COLORS, MONO, SANS } from "../theme";
import { PANELS, PANEL_HEADER, PANEL_RADIUS, type PanelId } from "./layout";

/**
 * Panel — the window chrome every product surface sits in.
 *
 * Dashboard-accurate: a #1C1C1C header over a #171717 body, 2px #2E2E2E
 * hairlines (2px so they survive the 0.33× pull-back), a feature icon, the
 * surface name and a breadcrumb. `dim` darkens panels the camera isn't about,
 * and `hidden` skips the body entirely when the panel is off screen.
 */

type PanelProps = {
  id: PanelId;
  title: string;
  crumb?: string;
  icon: ReactNode;
  right?: ReactNode;
  dim: number;
  visible: boolean;
  bodyStyle?: CSSProperties;
  /**
   * Horizontal header padding. Wide panels are framed with their outer margins
   * cropped, so their title and status sit inside the crop.
   */
  headerInset?: number;
  children: ReactNode;
};

export const Panel: React.FC<PanelProps> = ({
  id,
  title,
  crumb,
  icon,
  right,
  dim,
  visible,
  bodyStyle,
  headerInset = 32,
  children,
}) => {
  const rect = PANELS[id];
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        borderRadius: PANEL_RADIUS,
        background: COLORS.surfaceDeep,
        border: `2px solid ${COLORS.border}`,
        overflow: "hidden",
        boxShadow: "0 50px 140px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02) inset",
        fontFamily: SANS,
        color: COLORS.text,
      }}
    >
      <div
        style={{
          height: PANEL_HEADER,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: `0 ${headerInset}px`,
          background: COLORS.surface,
          borderBottom: `2px solid ${COLORS.border}`,
        }}
      >
        {icon}
        <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: "-0.01em" }}>{title}</div>
        {crumb ? (
          <div style={{ fontFamily: MONO, fontSize: 22, color: COLORS.faint, marginLeft: 6 }}>
            {crumb}
          </div>
        ) : null}
        <div style={{ flex: 1 }} />
        {right}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: PANEL_HEADER,
          right: 0,
          bottom: 0,
          ...bodyStyle,
        }}
      >
        {visible ? children : null}
      </div>
      {dim > 0.005 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: COLORS.world,
            opacity: dim,
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
};

/** Small status pill used in panel headers. */
export const Pill: React.FC<{
  children: ReactNode;
  tone?: "green" | "neutral";
  style?: CSSProperties;
}> = ({ children, tone = "neutral", style }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: 40,
      padding: "0 16px",
      borderRadius: 999,
      fontSize: 21,
      fontWeight: 500,
      color: tone === "green" ? COLORS.green : COLORS.muted,
      background: tone === "green" ? COLORS.greenTint : "rgba(255,255,255,0.03)",
      border: `1.5px solid ${tone === "green" ? COLORS.greenLine : COLORS.border}`,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Dot: React.FC<{ color?: string; size?: number; glow?: number }> = ({
  color = COLORS.green,
  size = 10,
  glow = 0.6,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      background: color,
      boxShadow: `0 0 ${size * 1.6}px rgba(62,207,142,${glow})`,
      flexShrink: 0,
    }}
  />
);
