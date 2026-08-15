import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

export type ScanlineCrtProps = {
  /** What the tube is showing. Omit to use it as a bare overlay layer. */
  children?: ReactNode;
  /** How many scanlines across the frame. */
  lineCount?: number;
  /** Darkness of a scanline, 0–1. */
  lineOpacity?: number;
  /** Scanline weight in px. */
  lineWidth?: number;
  /** How hard the tube face bows, 0–1. 0 draws dead straight lines. */
  curvature?: number;
  /** Corner radius of the tube face, in px. */
  cornerRadius?: number;
  /** Frames for the refresh bar to travel the frame. 0 removes it. */
  rollInFrames?: number;
  /** Brightness of the refresh bar, 0–1. */
  rollOpacity?: number;
  /** Frame-to-frame brightness jitter, 0–1. */
  flicker?: number;
  /** Strength of the RGB aperture grille, 0–1. */
  grille?: number;
  /** Corner darkening, 0–1. */
  vignette?: number;
  /** Phosphor tint over the whole picture. `transparent` leaves colours alone. */
  tint?: string;
  /** How the tint composites. */
  tintBlend?: CSSProperties["mixBlendMode"];
  /** Overall strength of every overlay at once, 0–1. */
  intensity?: number;
};

function hash(step: number, salt: number): number {
  const value = Math.sin(step * 91.7 + salt * 47.3) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Bowed scanlines.
 *
 * The curvature is drawn, not faked with a vignette. Each scanline is a
 * quadratic whose midpoint is pushed away from the centre of the tube in
 * proportion to its distance from it, so lines near the top bow up and lines
 * near the bottom bow down — the read that says "glass tube" long before the
 * corner shading does. Content underneath is not geometrically warped; warping
 * a live subtree needs a displacement map and costs more than the effect is
 * worth.
 */
function scanlines(count: number, curvature: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const y = ((index + 0.5) / count) * 100;
    const fromCenter = (50 - y) / 50;
    const bow = fromCenter * curvature * 4;
    return `M-4,${y.toFixed(3)} Q50,${(y - bow).toFixed(3)} 104,${y.toFixed(3)}`;
  });
}

/**
 * CRT scanlines, aperture grille and tube curvature.
 *
 * Four overlays that only work together: bowed scanlines for the tube, a fine
 * RGB grille for the phosphor mask, a rolling refresh bar for the camera-shot
 * -a-monitor look, and per-frame flicker for the mains hum. Take away the
 * flicker and it reads as a static texture, which is the failure mode of every
 * CSS CRT filter.
 *
 * Pass `children` to put content inside the tube, or drop it over a stack as a
 * bare overlay. It renders no plate of its own, so it composites over whatever
 * is beneath it either way. For emulsion rather than phosphor, reach for
 * `animated-noise-grain` instead — the two stack fine.
 */
export const ScanlineCrt: React.FC<ScanlineCrtProps> = ({
  children,
  lineCount = 90,
  lineOpacity = 0.34,
  lineWidth = 1.6,
  curvature = 0.55,
  cornerRadius = 22,
  rollInFrames = 96,
  rollOpacity = 0.16,
  flicker = 0.05,
  grille = 0.22,
  vignette = 0.55,
  tint = "transparent",
  tintBlend = "overlay",
  intensity = 1,
}) => {
  const frame = useCurrentFrame();

  const lines = scanlines(Math.max(2, Math.round(lineCount)), curvature);
  // Mains hum plus per-frame jitter. The hum is what stops the flicker reading
  // as random noise; the jitter is what stops the hum reading as a fade.
  const hum = 1 + Math.sin(frame * 0.9) * flicker * 0.35;
  const jitter = 1 + (hash(frame, 1) - 0.5) * flicker;
  const rollY = rollInFrames > 0 ? ((frame % rollInFrames) / rollInFrames) * 140 - 20 : -999;

  return (
    <AbsoluteFill style={{ borderRadius: cornerRadius, overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: `brightness(${(hum * jitter).toFixed(4)})` }}>
        {children}
      </AbsoluteFill>

      <AbsoluteFill style={{ opacity: intensity, pointerEvents: "none" }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%" }}
        >
          {lines.map((d, index) => (
            <path
              key={index}
              d={d}
              fill="none"
              stroke={`rgba(0,0,0,${lineOpacity})`}
              strokeWidth={lineWidth}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </AbsoluteFill>

      {grille > 0 ? (
        <AbsoluteFill
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(255,0,0,0.5) 0px, rgba(0,255,0,0.5) 1px, rgba(0,0,255,0.5) 2px, rgba(0,0,0,0) 3px)",
            mixBlendMode: "overlay",
            opacity: grille * intensity,
            pointerEvents: "none",
          }}
        />
      ) : null}

      {rollInFrames > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${rollY.toFixed(2)}%`,
            height: "18%",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 55%, rgba(255,255,255,0) 100%)",
            opacity: rollOpacity * intensity,
            mixBlendMode: "screen",
            filter: "blur(6px)",
            pointerEvents: "none",
          }}
        />
      ) : null}

      {tint !== "transparent" ? (
        <AbsoluteFill
          style={{ background: tint, mixBlendMode: tintBlend, opacity: intensity, pointerEvents: "none" }}
        />
      ) : null}

      {vignette > 0 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(120% 120% at 50% 50%, transparent 45%, rgba(0,0,0,${vignette}) 100%)`,
            pointerEvents: "none",
          }}
        />
      ) : null}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 42%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
