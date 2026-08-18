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

export type PollOption = {
  label: string;
  /** Raw tally. Shares are computed against the other options, not assumed. */
  votes: number;
};

export type PollOverlayProps = {
  question: string;
  options: PollOption[];
  /** Small tag above the question — POLL, AUDIENCE, EP 12. */
  badge?: string;
  /** Which edge the card sits against. */
  align?: "left" | "right" | "center";
  /**
   * Seconds the result holds before the card retreats. Omit to leave it up for
   * the rest of the scene.
   */
  holdSeconds?: number;
  /** Total-vote line under the options. Omit to hide it. */
  totalLabel?: string;
  accentColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

/** Beat plan in seconds. */
const T = {
  /** Card wipes open. */
  card: 0,
  cardFor: 0.5,
  badge: 0.16,
  question: 0.24,
  /** First option row arrives; the rest follow on `rowStagger`. */
  rows: 0.5,
  rowStagger: 0.09,
  /** Bars start travelling once the rows have all landed. */
  fill: 0.92,
  fillStagger: 0.11,
  fillFor: 0.78,
  /** The leading option takes the accent after every bar has settled. */
  winFor: 0.42,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * An audience poll that plays the whole beat: the card opens, the options
 * arrive, the bars travel out to their real shares while the percentages count
 * up under them, and the leading answer takes the accent once everything has
 * settled. Unlike `quiz-question` there is no correct answer — the winner is
 * whichever option the votes gave it.
 */
export const PollOverlay: React.FC<PollOverlayProps> = ({
  question,
  options,
  badge,
  align = "left",
  holdSeconds,
  totalLabel,
  accentColor = "#E8B86D",
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
  // D1. Authored against a 1280x720 reference, u resolves to 0.75 on the 960
  // docs stage, so a 15-unit label landed at 11px — 3.6px once the contact
  // sheet reduces the stage 3.1x. The reference is the whole design's scale, so
  // shrinking it grows the layout into the margin it was leaving empty and
  // lifts every tier of type with it, instead of hand-tuning font sizes against
  // a layout that stays too small.
  const u = portrait
    ? Math.min(width / 496, height / 896)
    : Math.min(width / 1024, height / 576);

  const total = options.reduce((sum, option) => sum + option.votes, 0);
  // A poll with no votes in yet still has to lay out — fall back to even
  // shares rather than dividing by zero into NaN widths.
  const share = (votes: number) => (total > 0 ? votes / total : 1 / options.length);
  const leaderIndex = options.reduce(
    (best, option, index) => (option.votes > options[best].votes ? index : best),
    0,
  );

  const card = spring({
    frame: frame - at(T.card),
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.8 },
  });
  const open = ease(T.card, T.card + T.cardFor, EASING.editorial);
  const badgeIn = badge ? ease(T.badge, T.badge + 0.36) : 0;
  const questionIn = ease(T.question, T.question + 0.44);

  const lastFill = T.fill + T.fillStagger * (options.length - 1) + T.fillFor;
  const win = ease(lastFill, lastFill + T.winFor, EASING.editorial);
  const totalIn = totalLabel ? ease(lastFill - 0.2, lastFill + 0.24) : 0;

  // Exits accelerate away; entrances decelerate in. Never ease-out an exit.
  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const cardW = Math.min(width - safe.paddingLeft - safe.paddingRight, 620 * u);
  const justify =
    align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";

  return (
    <AbsoluteFill style={{ pointerEvents: "none", fontFamily }}>
      <div
        style={{
          position: "absolute",
          left: safe.paddingLeft,
          right: safe.paddingRight,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          justifyContent: justify,
        }}
      >
        <div
          style={{
            width: cardW,
            borderRadius: 20 * u,
            background: `${palette.window}F2`,
            border: `1px solid ${palette.border}`,
            boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${24 * u}px ${
              60 * u
            }px ${palette.shadow}`,
            padding: `${24 * u}px ${26 * u}px ${totalLabel ? 20 * u : 24 * u}px`,
            // The card wipes open from its own top edge, then drops away.
            clipPath: `inset(0 0 ${(1 - open) * 100}% 0 round ${20 * u}px)`,
            opacity: 1 - exit,
            translate: `0 ${(1 - card) * 26 * u + exit * 34 * u}px`,
            overflow: "hidden",
          }}
        >
          {badge ? (
            <div
              style={{
                display: "inline-block",
                marginBottom: 12 * u,
                padding: `${6 * u}px ${12 * u}px`,
                borderRadius: 999,
                background: `${accentColor}1E`,
                border: `1px solid ${accentColor}66`,
                color: accentColor,
                fontSize: 15 * u,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                opacity: badgeIn,
                scale: `${interpolate(badgeIn, [0, 1], [0.86, 1])}`,
              }}
            >
              {badge}
            </div>
          ) : null}

          {/* Question rises out of its own mask */}
          <div style={{ overflow: "hidden", paddingBottom: "0.06em" }}>
            <div
              style={{
                color: palette.fg,
                fontSize: 30 * u,
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                translate: `0 ${(1 - questionIn) * 100}%`,
              }}
            >
              {question}
            </div>
          </div>

          <div
            style={{
              marginTop: 18 * u,
              display: "flex",
              flexDirection: "column",
              gap: 11 * u,
            }}
          >
            {options.map((option, index) => {
              const rowAt = T.rows + T.rowStagger * index;
              const rowIn = ease(rowAt, rowAt + 0.42);
              const fillAt = T.fill + T.fillStagger * index;
              const fillIn = ease(fillAt, fillAt + T.fillFor, EASING.editorial);
              const pct = share(option.votes) * fillIn;
              const leads = index === leaderIndex;
              const lit = leads ? win : 0;

              return (
                <div
                  key={option.label}
                  style={{
                    position: "relative",
                    height: 46 * u,
                    borderRadius: 12 * u,
                    background: palette.shadow,
                    border: `1px solid ${
                      leads
                        ? `${accentColor}${lit > 0.5 ? "88" : "33"}`
                        : palette.border
                    }`,
                    overflow: "hidden",
                    opacity: rowIn,
                    translate: `${(1 - rowIn) * -16 * u}px`,
                  }}
                >
                  {/* Bar travels out to the option's real share */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: `${pct * 100}%`,
                      background: leads
                        ? `linear-gradient(90deg, ${accentColor}${
                            lit > 0 ? "4D" : "2A"
                          }, ${accentColor}${lit > 0 ? "26" : "14"})`
                        : // Runners-up still have to read as filled bars — at
                          // 8% alpha they disappeared into the track entirely.
                          `linear-gradient(90deg, ${palette.fg}26, ${palette.fg}14)`,
                      borderRight: `${2 * u}px solid ${
                        leads ? accentColor : `${palette.fg}5C`
                      }`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: `0 ${14 * u}px`,
                    }}
                  >
                    <span
                      style={{
                        color: palette.fg,
                        fontSize: 19 * u,
                        fontWeight: leads && lit > 0.5 ? 600 : 500,
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      {option.label}
                    </span>
                    <span
                      style={{
                        color: leads && lit > 0 ? accentColor : palette.dim,
                        fontSize: 19 * u,
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                        flexShrink: 0,
                        marginLeft: 12 * u,
                      }}
                    >
                      {Math.round(pct * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {totalLabel ? (
            <div
              style={{
                marginTop: 14 * u,
                color: palette.dim,
                fontSize: 15 * u,
                fontWeight: 500,
                letterSpacing: "0.02em",
                opacity: totalIn,
              }}
            >
              {totalLabel}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
