import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type CountdownTimerProps = {
  /** Seconds on the clock when the scene opens. */
  from?: number;
  /** Ring sweep with the number inside, or the number on its own. */
  variant?: "ring" | "numeric";
  /** Caption above the clock — STARTING IN, DOORS OPEN, NEXT ROUND. */
  label?: string;
  /** Shown once the clock reaches zero. Omit to hold on `0`. */
  zeroLabel?: string;
  /** Seconds to wait before the clock starts running. */
  startDelaySeconds?: number;
  accentColor?: string;
  /** Accent applied over the last `urgentUnder` seconds. */
  urgentColor?: string;
  urgentUnder?: number;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * A countdown that reads as a clock rather than a number that happens to
 * change: the ring drains continuously while the digit swaps on each whole
 * second, the last few seconds take the urgent accent, and zero lands with one
 * pop instead of ticking past into negative time.
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  from = 5,
  variant = "ring",
  label,
  zeroLabel,
  startDelaySeconds = 0.35,
  accentColor = "#E8B86D",
  urgentColor = "#F97362",
  urgentUnder = 3,
  theme = "dark",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];

  const at = (seconds: number) => (seconds * fps) / speed;
  const u = Math.min(width / 1280, height / 720);

  const elapsed = Math.max(0, (frame - at(startDelaySeconds)) / fps) * speed;
  const remaining = Math.max(0, from - elapsed);
  // The digit is what a viewer would read off a clock: 4.2s left shows "5".
  const shown = Math.ceil(remaining);
  const done = remaining <= 0;
  const urgent = remaining > 0 && remaining <= urgentUnder;
  const tint = urgent ? urgentColor : accentColor;

  const intro = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.9 },
  });
  const labelIn = label ? interpolate(frame, [0, at(0.44)], [0, 1], {
    easing: EASING.enter,
    ...clamp,
  }) : 0;

  // Each whole second lands its own pop, keyed off the fraction left inside
  // the current second — this is what makes the swap read as a tick.
  const intoSecond = shown - remaining;
  const tick = done
    ? 0
    : interpolate(intoSecond, [0, 0.26], [1, 0], { easing: EASING.exit, ...clamp });
  const zero = done
    ? spring({
        frame: frame - at(startDelaySeconds + from),
        fps,
        config: { damping: 12, stiffness: 180, mass: 0.7 },
      })
    : 0;

  const digitScale = 1 + tick * 0.12 + zero * 0.1;
  const ringSize = 300 * u;
  const stroke = 12 * u;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // Drains continuously, so the ring never sits still between ticks.
  const swept = from > 0 ? remaining / from : 0;

  const face = (
    <div
      style={{
        position: "relative",
        display: "grid",
        placeItems: "center",
        width: variant === "ring" ? ringSize : "auto",
        height: variant === "ring" ? ringSize : "auto",
      }}
    >
      {variant === "ring" ? (
        <svg
          width={ringSize}
          height={ringSize}
          viewBox={`0 0 ${ringSize} ${ringSize}`}
          style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
        >
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke={palette.border}
            strokeWidth={stroke}
          />
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke={tint}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - swept)}
            opacity={done ? 1 - zero * 0.7 : 1}
          />
        </svg>
      ) : null}

      <div
        style={{
          position: "relative",
          color: done ? tint : palette.fg,
          fontSize: (done && zeroLabel ? 68 : 128) * u,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          fontVariantNumeric: "tabular-nums",
          transform: `scale(${digitScale})`,
          textShadow: urgent || done ? `0 0 ${34 * u}px ${tint}59` : undefined,
        }}
      >
        {done ? (zeroLabel ?? "0") : shown}
      </div>
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        display: "grid",
        placeItems: "center",
        background: palette.page,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22 * u,
          transform: `translateY(${(1 - intro) * 20 * u}px)`,
          opacity: intro,
        }}
      >
        {label ? (
          <div
            style={{
              color: palette.dim,
              fontSize: 22 * u,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              opacity: labelIn,
            }}
          >
            {label}
          </div>
        ) : null}
        {face}
      </div>
    </AbsoluteFill>
  );
};
