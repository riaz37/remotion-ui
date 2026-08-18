import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type FeatureItem = {
  label: string;
  /** Second line under the label. */
  detail?: string;
};

export type FeatureListProps = {
  title?: string;
  /** Small label above the title. */
  eyebrow?: string;
  /** Rows, as plain strings or `{ label, detail }`. */
  items?: (string | FeatureItem)[];
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /**
   * Seconds after which the scene leaves. Omit to hold — correct inside a
   * `TransitionSeries`, where the transition covers the tail, and wrong on
   * its own, where the scene stands still for the rest of the clip.
   */
  holdSeconds?: number;
  /** Animation speed multiplier. */
  speed?: number;
};

/** Beat plan in seconds. */
const T = {
  eyebrow: 0,
  title: 0.14,
  /** First row lands here. */
  rows: 0.55,
  /** Added per row. */
  rowStagger: 0.34,
  /** How long after a row lands its check strokes in. */
  checkAfter: 0.22,
  exitFor: 0.4,
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
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={22}
      strokeDashoffset={22 * (1 - progress)}
    />
  </svg>
);

/**
 * A list being ticked off rather than a stack of bullets fading in: each row
 * arrives in turn, its rule draws across, and its check strokes in behind it —
 * so the scene lands on a list that has visibly been worked through.
 */
export const FeatureList: React.FC<FeatureListProps> = ({
  title,
  eyebrow,
  items = [],
  accentColor = "#E8B86D",
  backgroundColor,
  theme = "dark",
  holdSeconds,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });
  // Exits accelerate away; entrances decelerate in. Never ease-out an exit.
  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(
          frame,
          [at(holdSeconds), at(holdSeconds + T.exitFor)],
          [0, 1],
          { easing: EASING.exit, ...clamp },
        );

  const stage = {
    w: width - safe.paddingLeft - safe.paddingRight,
    h: height - safe.paddingTop - safe.paddingBottom,
  };
  const portrait = height > width;
  const u = portrait
    ? Math.min(stage.w / 620, stage.h / 1120)
    : Math.min(stage.w / 1120, stage.h / 620);

  const rows = items
    .slice(0, 5)
    .map((item) => (typeof item === "string" ? { label: item } : item));
  const eyebrowIn = eyebrow ? ease(T.eyebrow, T.eyebrow + 0.45) : 0;
  const titleIn = title ? ease(T.title, T.title + 0.5) : 0;

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
          background: `radial-gradient(ellipse 70% 55% at 24% 30%, ${accentColor}16, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: safe.paddingLeft,
          top: safe.paddingTop,
          width: stage.w,
          height: stage.h,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 30 * u,
          opacity: 1 - exit,
          translate: `0 ${exit * -26 * u}px`,
        }}
      >
        {eyebrow || title ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 * u }}>
            {eyebrow ? (
              <div
                style={{
                  color: accentColor,
                  fontSize: 20 * u,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  opacity: eyebrowIn,
                  translate: `0 ${(1 - eyebrowIn) * 10 * u}px`,
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            {title ? (
              <div style={{ overflow: "hidden", paddingBottom: "0.04em" }}>
                <h2
                  style={{
                    margin: 0,
                    color: palette.fg,
                    fontSize: 58 * u,
                    fontWeight: 700,
                    lineHeight: 1.06,
                    letterSpacing: "-0.02em",
                    translate: `0 ${(1 - titleIn) * 100}%`,
                  }}
                >
                  {title}
                </h2>
              </div>
            ) : null}
          </div>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column" }}>
          {rows.map((row, index) => {
            const start = T.rows + index * T.rowStagger;
            const rowIn = ease(start, start + 0.45);
            const rule = ease(start + 0.06, start + 0.5, EASING.editorial);
            const check = ease(
              start + T.checkAfter,
              start + T.checkAfter + 0.34,
            );

            return (
              <div key={`${row.label}-${index}`}>
                {/* The rule draws across ahead of the row settling */}
                <div
                  style={{
                    height: 1,
                    background: palette.border,
                    transformOrigin: "left center",
                    scale: `${rule} 1`,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18 * u,
                    padding: `${17 * u}px 0`,
                    opacity: rowIn,
                    translate: `${(1 - rowIn) * -18 * u}px`,
                  }}
                >
                  <div
                    style={{
                      width: 40 * u,
                      height: 40 * u,
                      flexShrink: 0,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      background: `${accentColor}1A`,
                      border: `1px solid ${
                        check > 0.1 ? `${accentColor}88` : palette.border
                      }`,
                    }}
                  >
                    <CheckGlyph
                      size={22 * u}
                      color={accentColor}
                      progress={check}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        color: palette.fg,
                        fontSize: 32 * u,
                        fontWeight: 600,
                        lineHeight: 1.2,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {row.label}
                    </div>
                    {row.detail ? (
                      <div
                        style={{
                          marginTop: 5 * u,
                          color: palette.faint,
                          fontSize: 22 * u,
                          lineHeight: 1.35,
                        }}
                      >
                        {row.detail}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Closing rule, so the list ends on a line rather than in mid-air */}
          <div
            style={{
              height: 1,
              background: palette.border,
              transformOrigin: "left center",
              scale: `${ease(
                T.rows + rows.length * T.rowStagger,
                T.rows + rows.length * T.rowStagger + 0.45,
                EASING.editorial,
              )} 1`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
