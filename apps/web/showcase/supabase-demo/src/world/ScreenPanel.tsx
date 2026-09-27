import type { ReactNode } from "react";
import { COLORS } from "../theme";
import { PANELS, PANEL_RADIUS, type PanelId } from "./layout";

/**
 * ScreenPanel — one real dashboard screen floating on the world canvas.
 *
 * The capture already carries Supabase's own chrome, so the frame adds only
 * what makes it read as a window: rounded corners, a hairline, a deep shadow.
 * `dim` steps the panel back when the camera is about something else, and
 * `visible` skips the capture layers entirely when the panel is off screen.
 */

type Props = { id: PanelId; dim: number; visible: boolean; children: ReactNode };

export const ScreenPanel: React.FC<Props> = ({ id, dim, visible, children }) => {
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
        overflow: "hidden",
        background: COLORS.well,
        boxShadow: "0 50px 140px rgba(0,0,0,0.6), 0 0 0 2px #2A2A2A",
      }}
    >
      {visible ? children : null}
      {dim > 0.005 ? (
        <div style={{ position: "absolute", inset: 0, background: COLORS.world, opacity: dim }} />
      ) : null}
    </div>
  );
};
