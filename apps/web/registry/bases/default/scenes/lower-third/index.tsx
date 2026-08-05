import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type LowerThirdProps = {
  title: string;
  subtitle?: string;
  /** Small tag on the plate — LIVE, EP 12, the segment name. */
  badge?: string;
  /** Which edge the plate slides out from. */
  align?: "left" | "right";
  /**
   * Seconds the plate holds before it retreats. Omit to leave it on screen for
   * the rest of the scene.
   */
  holdSeconds?: number;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

/** Beat plan in seconds. */
const T = {
  /** Plate wipes out from the frame edge. */
  plate: 0,
  plateFor: 0.5,
  title: 0.22,
  subtitle: 0.38,
  badge: 0.5,
  /** Retreat, once the hold is over. */
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * A name plate that plays its whole life: it wipes out from the frame edge, the
 * name and role settle inside it, it holds, and then it retreats the way it
 * came — rather than fading on and being left standing for the rest of the cut.
 */
export const LowerThird: React.FC<LowerThirdProps> = ({
  title,
  subtitle,
  badge,
  align = "left",
  holdSeconds,
  accentColor = "#E8B86D",
  backgroundColor,
  theme = "dark",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });

  const portrait = height > width;
  const u = portrait
    ? Math.min(width / 620, height / 1120)
    : Math.min(width / 1280, height / 720);
  const isRight = align === "right";

  const plate = spring({
    frame: frame - at(T.plate),
    fps,
    config: { damping: 17, stiffness: 130, mass: 0.8 },
  });
  const open = ease(T.plate, T.plate + T.plateFor, EASING.editorial);
  const titleIn = ease(T.title, T.title + 0.42);
  const subtitleIn = subtitle ? ease(T.subtitle, T.subtitle + 0.42) : 0;
  const badgeIn = badge ? ease(T.badge, T.badge + 0.4) : 0;
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

  const plateW = Math.min(width - safe.paddingLeft - safe.paddingRight, 660 * u);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", fontFamily }}>
      <div
        style={{
          position: "absolute",
          left: safe.paddingLeft,
          right: safe.paddingRight,
          bottom: Math.max(safe.paddingBottom, 74 * u),
          display: "flex",
          justifyContent: isRight ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            // Hugs its content: a name plate stretched to a fixed width leaves
            // a long empty bar next to a short name.
            width: "fit-content",
            maxWidth: plateW,
            borderRadius: 16 * u,
            background: backgroundColor ?? `${palette.window}F0`,
            border: `1px solid ${palette.border}`,
            boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${
              20 * u
            }px ${52 * u}px ${palette.shadow}`,
            padding: `${17 * u}px ${24 * u}px`,
            // The plate wipes open from its own edge, then retreats the same way.
            clipPath: `inset(0 ${isRight ? 0 : (1 - open) * 100}% 0 ${
              isRight ? (1 - open) * 100 : 0
            }% round ${16 * u}px)`,
            opacity: 1 - exit,
            transform: `translateX(${
              (1 - plate) * (isRight ? 40 : -40) * u +
              exit * (isRight ? 60 : -60) * u
            }px)`,
            display: "flex",
            alignItems: "center",
            gap: 16 * u,
            overflow: "hidden",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            {/* Name rises out of its own mask */}
            <div style={{ overflow: "hidden", paddingBottom: "0.04em" }}>
              <div
                style={{
                  color: palette.fg,
                  fontSize: 34 * u,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  transform: `translateY(${(1 - titleIn) * 100}%)`,
                }}
              >
                {title}
              </div>
            </div>
            {subtitle ? (
              <div
                style={{
                  marginTop: 4 * u,
                  color: palette.dim,
                  fontSize: 22 * u,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  opacity: subtitleIn,
                  transform: `translateY(${(1 - subtitleIn) * 8 * u}px)`,
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>

          {badge ? (
            <div
              style={{
                flexShrink: 0,
                padding: `${7 * u}px ${13 * u}px`,
                borderRadius: 999,
                background: `${accentColor}1E`,
                border: `1px solid ${accentColor}66`,
                color: accentColor,
                fontSize: 17 * u,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                opacity: badgeIn,
                transform: `scale(${interpolate(badgeIn, [0, 1], [0.86, 1])})`,
              }}
            >
              {badge}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
