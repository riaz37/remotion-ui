import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame } from "remotion";

export type GlowPulseMode = "breathe" | "beat";

export type GlowPulseProps = {
  children: ReactNode;
  /** Glow colour. */
  color?: string;
  /** Glow radius at full brightness, in px. */
  radius?: number;
  /** Brightness at the top of the pulse, 0–1. */
  intensity?: number;
  /** Brightness at the bottom of the pulse. Never 0 for a live indicator. */
  floor?: number;
  /** Length of one pulse, in frames. */
  periodInFrames?: number;
  /** `breathe` is a sine; `beat` is a fast attack and a long decay. */
  mode?: GlowPulseMode;
  /** Scale added at the top of the pulse. 0 glows without moving. */
  scale?: number;
  /** Halo behind the element, as a multiple of `radius`. 0 removes it. */
  halo?: number;
  /** Second beat per cycle, offset by this fraction — a heartbeat's double tap. */
  echo?: number;
  block?: boolean;
  style?: CSSProperties;
  className?: string;
};

/**
 * A pulse envelope in 0–1.
 *
 * `beat` is not a sine with a different phase: it rises in the first eighth of
 * the cycle and decays across the rest, which is why a live dot reads as
 * pulsing rather than as fading in and out. The optional `echo` adds the second,
 * smaller tap that makes it read as a heartbeat instead of a metronome.
 */
function pulseEnvelope(t: number, mode: GlowPulseMode, echo: number): number {
  if (mode === "breathe") {
    return 0.5 - 0.5 * Math.cos(t * Math.PI * 2);
  }

  const tap = (offset: number) => {
    const local = ((t - offset) % 1 + 1) % 1;
    if (local < 0.12) return local / 0.12;
    return Math.max(0, 1 - (local - 0.12) / 0.55) ** 1.6;
  };

  return Math.min(1, tap(0) + (echo > 0 ? tap(0.18) * echo : 0));
}

/**
 * A rhythmic glow for CTAs and live indicators.
 *
 * The glow is a `drop-shadow` filter rather than a `box-shadow`, so it follows
 * the alpha of whatever it wraps — a pill, a ring, a piece of type, an SVG mark
 * — instead of the bounding box. That is the whole reason this is a wrapper
 * primitive and not a styled div.
 *
 * `floor` matters more than `intensity`. A live indicator that reaches zero
 * reads as broken rather than as breathing, so the pulse rides above a
 * standing glow.
 */
export const GlowPulse: React.FC<GlowPulseProps> = ({
  children,
  color = "#e8b86d",
  radius = 26,
  intensity = 1,
  floor = 0.28,
  periodInFrames = 36,
  mode = "breathe",
  scale = 0.04,
  halo = 2.4,
  echo = 0,
  block,
  style,
  className,
}) => {
  const frame = useCurrentFrame();

  const period = Math.max(2, Math.round(periodInFrames));
  const t = ((frame % period) + period) % period / period;
  const level = floor + (intensity - floor) * pulseEnvelope(t, mode, echo);
  const glow = radius * level;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: block ? "block" : "inline-block",
        ...(block ? { width: "100%" } : {}),
        verticalAlign: "top",
        ...style,
      }}
    >
      {halo > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: -radius * halo * 0.5,
            borderRadius: "50%",
            background: `radial-gradient(closest-side, ${color} 0%, transparent 72%)`,
            opacity: 0.42 * level,
            filter: `blur(${(radius * halo * 0.25).toFixed(1)}px)`,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      ) : null}
      <div
        style={{
          position: "relative",
          transform: `scale(${(1 + scale * level).toFixed(4)})`,
          filter: `drop-shadow(0 0 ${glow.toFixed(1)}px ${color}) drop-shadow(0 0 ${(glow * 2.2).toFixed(1)}px ${color})`,
          willChange: "filter, transform",
        }}
      >
        {children}
      </div>
    </div>
  );
};
