import type { CSSProperties, ReactNode } from "react";
import { Img } from "remotion";
import { captureSrc, type CaptureId, type Rect } from "../captures";
import { PANEL } from "../camera/shots";

/**
 * Plane: a 1920×1080 surface placed in the world, shot like a physical object.
 *
 * `tiltX` / `tiltY` lean it back in 3D about its centre (5–10° reads as a
 * screen on a desk, more reads as a trick). `focus` is 0 for sharp, up to 1
 * for fully out of focus and dimmed, for depth-of-field when something else
 * takes the foreground.
 */
export const Plane: React.FC<{
  x: number;
  y: number;
  scale?: number;
  tiltX?: number;
  tiltY?: number;
  focus?: number;
  opacity?: number;
  radius?: number;
  children: ReactNode;
  style?: CSSProperties;
}> = ({ x, y, scale = 1, tiltX = 0, tiltY = 0, focus = 0, opacity = 1, radius = 18, children, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: PANEL.w,
      height: PANEL.h,
      transformOrigin: "50% 50%",
      transform: `perspective(2600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${scale})`,
      borderRadius: radius,
      overflow: "hidden",
      opacity,
      boxShadow: "0 60px 140px rgba(0,0,0,0.65), 0 0 0 1px rgba(236,236,236,0.07)",
      filter: focus > 0.01 ? `blur(${(focus * 7).toFixed(2)}px) brightness(${(1 - focus * 0.45).toFixed(3)})` : undefined,
      ...style,
    }}
  >
    {children}
  </div>
);

/** A capture, drawn at panel size (the PNG is 2×, so it stays sharp up to s = 2). */
export const Capture: React.FC<{ id: CaptureId; opacity?: number; blend?: CSSProperties["mixBlendMode"] }> = ({
  id,
  opacity = 1,
  blend,
}) => (
  <Img
    src={captureSrc(id)}
    style={{ position: "absolute", left: 0, top: 0, width: PANEL.w, height: PANEL.h, opacity, mixBlendMode: blend }}
  />
);

/**
 * A live composition laid into a rect of a capture, e.g. the page's Remotion
 * Player. The child renders at 1920×1080 (the film's own size, which is what
 * its useVideoConfig reports) and is scaled down into the rect.
 */
export const InRect: React.FC<{ rect: Rect; background?: string; children: ReactNode }> = ({ rect, background, children }) => (
  <div
    style={{
      position: "absolute",
      left: rect.x,
      top: rect.y,
      width: rect.w,
      height: rect.h,
      overflow: "hidden",
      background,
    }}
  >
    <div style={{ width: PANEL.w, height: PANEL.h, transformOrigin: "0 0", transform: `scale(${rect.w / PANEL.w})` }}>
      {children}
    </div>
  </div>
);
