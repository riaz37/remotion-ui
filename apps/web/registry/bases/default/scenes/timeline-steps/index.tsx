import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type TimelineStep = {
  title: string;
  description?: string;
};

export type TimelineStepsProps = {
  /** Steps in order. Two to five read best at any aspect. */
  steps: TimelineStep[];
  /** Optional heading above the rail. */
  title?: string;
  /** Small label above the heading — phase, release, chapter. */
  eyebrow?: string;
  backgroundColor?: string;
  accentColor?: string;
  theme?: "dark" | "light";
  /**
   * Seconds the walked timeline holds before it retreats. Omit to leave it up
   * for the rest of the scene — a scene inside a `TransitionSeries` wants the
   * transition to cover its tail rather than fading under it.
   */
  holdSeconds?: number;
  /** Animation speed multiplier. */
  speed?: number;
};

/** Beat plan in seconds. */
const T = {
  title: 0,
  /** First step lights up here. */
  start: 0.5,
  /** Time a step is worked before it is checked off. */
  dwell: 0.78,
  /** Time the head takes to travel to the next step. */
  travel: 0.42,
  /** Length of the retreat once `holdSeconds` is up. */
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const CheckGlyph: React.FC<{
  size: number;
  color: string;
  progress: number;
}> = ({ size, color, progress }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4.8 12.6l4.9 4.9 9.5-10.4"
      stroke={color}
      strokeWidth={2.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={22}
      strokeDashoffset={22 * (1 - progress)}
    />
  </svg>
);

/**
 * A process that advances rather than a row of dots fading in: the rail draws
 * ahead of a travelling head, each step lights as the head lands on it, works
 * through a ring that closes, then checks off and dims to done as the head
 * moves on — so the scene ends on a fully walked timeline.
 */
export const TimelineSteps: React.FC<TimelineStepsProps> = ({
  steps,
  title,
  eyebrow,
  backgroundColor,
  accentColor = "#E8B86D",
  theme = "dark",
  holdSeconds,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  const now = (frame / fps) * speed;
  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });

  const stage = {
    x: safe.paddingLeft,
    y: safe.paddingTop,
    w: width - safe.paddingLeft - safe.paddingRight,
    h: height - safe.paddingTop - safe.paddingBottom,
  };
  const portrait = height > width;
  const u = Math.min(stage.w / 1120, stage.h / 620);
  const list = steps.slice(0, 5);
  const count = list.length;

  /** When the head lands on step `index`, and when that step is checked off. */
  const arrival = (index: number) => T.start + index * (T.dwell + T.travel);
  const completion = (index: number) => arrival(index) + T.dwell;
  const finished = completion(count - 1);

  const node = 60 * u;
  const headerH = title || eyebrow ? (title ? 108 * u : 44 * u) : 0;
  const railInset = portrait ? node / 2 + 4 * u : stage.w / count / 2;
  const railStart = portrait ? headerH + node * 0.9 : railInset;
  const railEnd = portrait ? stage.h - node * 0.6 : stage.w - railInset;
  const railSpan = Math.max(railEnd - railStart, 1);
  // In landscape the rail carries its copy underneath, so it is offset to
  // centre the rail-plus-copy block in what the header left — parking it at a
  // fixed fraction leaves the bottom of the frame empty.
  const hasDescription = list.some((step) => step.description);
  const copyDrop = node * 0.78 + (hasDescription ? 116 * u : 48 * u);
  const railAcross = portrait
    ? node / 2
    : headerH +
      Math.max(
        node / 2,
        (stage.h - headerH - (copyDrop + node / 2)) / 2 + node / 2,
      );

  const nodeAt = (index: number) =>
    railStart + (count === 1 ? railSpan / 2 : (index / (count - 1)) * railSpan);

  /** Head position as a fraction of the rail, holding still during each dwell. */
  const headIndex = (() => {
    if (now <= arrival(0)) {
      return 0;
    }
    for (let index = 0; index < count - 1; index += 1) {
      if (now < completion(index)) {
        return index;
      }
      if (now < arrival(index + 1)) {
        return interpolate(
          now,
          [completion(index), arrival(index + 1)],
          [index, index + 1],
          { easing: EASING.editorial, ...clamp },
        );
      }
    }
    return count - 1;
  })();
  const headPos = nodeAt(headIndex);
  const railDrawn = ease(T.start - 0.35, T.start + 0.15);

  const titleIn = ease(T.title, T.title + 0.55);

  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(
          frame,
          [at(holdSeconds), at(holdSeconds + T.exitFor)],
          [0, 1],
          { easing: EASING.exit, ...clamp },
        );

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor ?? palette.page,
        fontFamily,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 80% 50% at 50% ${
            portrait ? 30 : 40
          }%, ${accentColor}14, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: stage.x,
          top: stage.y,
          width: stage.w,
          height: stage.h,
          opacity: 1 - exit,
          translate: `0 ${exit * 30 * u}px`,
        }}
      >
        {eyebrow ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              color: accentColor,
              fontSize: 21 * u,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: titleIn,
              translate: `0 ${(1 - titleIn) * 10 * u}px`,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        {title ? (
          <h2
            style={{
              position: "absolute",
              left: 0,
              top: eyebrow ? 36 * u : 0,
              margin: 0,
              color: palette.fg,
              fontSize: 62 * u,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              opacity: titleIn,
              translate: `0 ${(1 - titleIn) * 16 * u}px`,
            }}
          >
            {title}
          </h2>
        ) : null}

        {/* Rail: the unwalked track, then the walked part behind the head */}
        <div
          style={{
            position: "absolute",
            left: portrait ? railAcross - 1.5 * u : railStart,
            top: portrait ? railStart : railAcross - 1.5 * u,
            width: portrait ? 3 * u : railSpan,
            height: portrait ? railSpan : 3 * u,
            background: palette.border,
            borderRadius: 999,
            transformOrigin: portrait ? "center top" : "left center",
            transform: portrait
              ? `scaleY(${railDrawn})`
              : `scaleX(${railDrawn})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: portrait ? railAcross - 1.5 * u : railStart,
            top: portrait ? railStart : railAcross - 1.5 * u,
            width: portrait ? 3 * u : Math.max(headPos - railStart, 0),
            height: portrait ? Math.max(headPos - railStart, 0) : 3 * u,
            background: accentColor,
            borderRadius: 999,
            boxShadow: `0 0 ${14 * u}px ${accentColor}88`,
            opacity: railDrawn,
          }}
        />

        {list.map((step, index) => {
          const landed = ease(arrival(index), arrival(index) + 0.3);
          const work = interpolate(
            now,
            [arrival(index), completion(index)],
            [0, 1],
            { easing: EASING.editorial, ...clamp },
          );
          const check = interpolate(
            now,
            [completion(index), completion(index) + 0.32],
            [0, 1],
            { easing: EASING.enter, ...clamp },
          );
          const active = landed * (1 - check * 0.55);
          const pop = spring({
            frame: frame - at(arrival(index)),
            fps,
            config: { damping: 12, stiffness: 200, mass: 0.6 },
          });
          const along = nodeAt(index);
          const copyIn = ease(arrival(index) + 0.08, arrival(index) + 0.5);

          const ringRadius = node / 2 - 2 * u;
          const ringLength = 2 * Math.PI * ringRadius;

          return (
            <div key={step.title}>
              {/* Node */}
              <div
                style={{
                  position: "absolute",
                  left: (portrait ? railAcross : along) - node / 2,
                  top: (portrait ? along : railAcross) - node / 2,
                  width: node,
                  height: node,
                  borderRadius: "50%",
                  background:
                    check > 0.4
                      ? `${accentColor}22`
                      : landed > 0.1
                        ? accentColor
                        : palette.window,
                  border: `${2 * u}px solid ${
                    landed > 0.1 ? accentColor : palette.border
                  }`,
                  boxShadow: `0 0 ${34 * u * active}px ${accentColor}66`,
                  display: "grid",
                  placeItems: "center",
                  scale: `${
                    interpolate(railDrawn, [0, 1], [0.75, 1]) + pop * 0.06
                  }`,
                  color: check > 0.4 ? accentColor : landed > 0.1 ? palette.page : palette.dim,
                  fontSize: 26 * u,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {check > 0.05 ? (
                  <CheckGlyph
                    size={30 * u}
                    color={accentColor}
                    progress={check}
                  />
                ) : (
                  index + 1
                )}
              </div>

              {/* Working ring — closes over the dwell, then hands off to the check */}
              <svg
                width={node + 16 * u}
                height={node + 16 * u}
                style={{
                  position: "absolute",
                  left: (portrait ? railAcross : along) - (node + 16 * u) / 2,
                  top: (portrait ? along : railAcross) - (node + 16 * u) / 2,
                  opacity: landed * (1 - check),
                  transform: "rotate(-90deg)",
                }}
              >
                <circle
                  cx={(node + 16 * u) / 2}
                  cy={(node + 16 * u) / 2}
                  r={ringRadius + 6 * u}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={2.4 * u}
                  strokeLinecap="round"
                  strokeDasharray={ringLength}
                  strokeDashoffset={ringLength * (1 - work)}
                />
              </svg>

              {/* Copy */}
              <div
                style={{
                  position: "absolute",
                  left: portrait
                    ? railAcross + node * 0.85
                    : along - stage.w / count / 2 + 10 * u,
                  top: portrait
                    ? along - node * 0.34
                    : railAcross + node * 0.78,
                  width: portrait
                    ? stage.w - railAcross - node * 0.85
                    : stage.w / count - 20 * u,
                  opacity: copyIn,
                  translate: `0 ${(1 - copyIn) * 14 * u}px`,
                }}
              >
                <div
                  style={{
                    color: check > 0.4 ? palette.dim : palette.fg,
                    fontSize: 30 * u,
                    fontWeight: 600,
                    lineHeight: 1.15,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {step.title}
                </div>
                {step.description ? (
                  <div
                    style={{
                      marginTop: 9 * u,
                      color: palette.faint,
                      fontSize: 21 * u,
                      lineHeight: 1.35,
                    }}
                  >
                    {step.description}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {/* Travelling head — only between steps, where there is travel to show */}
        <div
          style={{
            position: "absolute",
            left: (portrait ? railAcross : headPos) - 7 * u,
            top: (portrait ? headPos : railAcross) - 7 * u,
            width: 14 * u,
            height: 14 * u,
            borderRadius: "50%",
            background: accentColor,
            boxShadow: `0 0 ${18 * u}px ${accentColor}`,
            opacity:
              railDrawn *
              (now >= finished ? 0 : Math.abs(headIndex % 1) > 0.02 ? 1 : 0),
          }}
        />
      </div>
    </div>
  );
};
