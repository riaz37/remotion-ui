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

export type FormField = {
  /** Label above the input. */
  label: string;
  /** Text that gets typed into the field. */
  value: string;
  /** Greyed text shown before the caret arrives. */
  placeholder?: string;
};

export type FormFillSequenceProps = {
  fields?: FormField[];
  /** Heading on the card. Omit to show the fields alone. */
  title?: string;
  /** Supporting line under the heading. */
  subtitle?: string;
  /** Text on the submit button while it is waiting. */
  submitLabel?: string;
  /** Text the button swaps to once every field has validated. */
  successLabel?: string;
  /**
   * Typing rate. Field durations are derived from this and each value's
   * length, so a long email takes visibly longer to enter than a short name.
   */
  charsPerSecond?: number;
  /**
   * Seconds the filled form holds before the card retreats. Omit to leave it
   * on screen for the rest of the scene.
   */
  holdSeconds?: number;
  accentColor?: string;
  /** Tick and valid-border colour. Kept off `accentColor` so focus and
   * validation stay two readable states rather than one. */
  validColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_FIELDS: FormField[] = [
  { label: "Full name", value: "Ada Lovelace", placeholder: "Your name" },
  { label: "Work email", value: "ada@northstar.dev", placeholder: "you@company.com" },
  { label: "Team size", value: "12–40 people", placeholder: "Select a range" },
];

/** Beat plan in seconds. Field beats are derived, not listed — they depend on
 * how much text each field holds. */
const T = {
  /** Card lifts in. */
  card: 0,
  cardFor: 0.5,
  title: 0.14,
  subtitle: 0.24,
  /** First field row arrives; the rest follow on `rowStagger`. */
  rows: 0.3,
  rowStagger: 0.08,
  /** The caret lands in the first field. */
  firstField: 0.55,
  /** Gap between one field validating and the next taking focus. */
  betweenFields: 0.26,
  /** How long the tick takes to draw. */
  checkFor: 0.28,
  /** Pause after the last tick before the button arms. */
  beforeSubmit: 0.34,
  submitFor: 0.34,
  successFor: 0.3,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const CheckGlyph: React.FC<{ size: number; color: string; progress: number }> = ({
  size,
  color,
  progress,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12.4l4.6 4.6L19 6.6"
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
 * A sign-up form filling itself out: the caret drops into each field in turn,
 * types the value at a real typing rate, and the field ticks green before focus
 * moves on. The button only arms once every field has validated.
 *
 * Distinct from `search-results-populate`, where typing is a single query and
 * the payoff is the result list — here the typing *is* the subject, and each
 * field carries its own validation state.
 */
export const FormFillSequence: React.FC<FormFillSequenceProps> = ({
  fields = DEFAULT_FIELDS,
  title = "Create your workspace",
  subtitle = "Takes about a minute.",
  submitLabel = "Create workspace",
  successLabel = "Workspace created",
  charsPerSecond = 34,
  holdSeconds,
  accentColor = "#E8B86D",
  validColor = "#7FD1A0",
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
  // D1. Authored against a 1280x720 reference, u resolves to 0.75 on the 960
  // docs stage, so a 15-unit label landed at 11px — 3.6px once the contact
  // sheet reduces the stage 3.1x. The reference is the whole design's scale, so
  // shrinking it grows the layout into the margin it was leaving empty and
  // lifts every tier of type with it, instead of hand-tuning font sizes against
  // a layout that stays too small.
  const u = portrait
    ? Math.min(width / 496, height / 896)
    : Math.min(width / 1024, height / 576);

  // Each field's beat depends on the one before it, so the schedule is built
  // once by walking the list rather than read off fixed constants.
  let cursor = T.firstField;
  const schedule = fields.map((field) => {
    const start = cursor;
    // A field with no value still needs a non-zero beat or the caret would
    // teleport through it in the same frame it arrived.
    const typeFor = Math.max(0.12, field.value.length / charsPerSecond);
    cursor = start + typeFor + T.betweenFields;
    return { start, typeFor, done: start + typeFor };
  });

  const lastDone = schedule.length > 0 ? schedule[schedule.length - 1].done : T.firstField;
  const submitAt = lastDone + T.beforeSubmit;
  const successAt = submitAt + T.submitFor;

  const card = spring({
    frame: frame - at(T.card),
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });
  const open = ease(T.card, T.card + T.cardFor, EASING.editorial);
  const titleIn = title ? ease(T.title, T.title + 0.42) : 0;
  const subtitleIn = subtitle ? ease(T.subtitle, T.subtitle + 0.42) : 0;
  const armed = ease(submitAt, submitAt + T.submitFor, EASING.editorial);
  const success = ease(successAt, successAt + T.successFor, EASING.editorial);

  // Exits accelerate away; entrances decelerate in. Never ease-out an exit.
  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const cardW = Math.min(width - safe.paddingLeft - safe.paddingRight, 660 * u);
  // Half-second blink, derived from the frame so it is identical on a re-render.
  const caretOn = Math.floor(frame / (fps * 0.45)) % 2 === 0;

  return (
    <AbsoluteFill
      style={{
        background: backgroundColor ?? palette.page,
        fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `${safe.paddingTop}px ${safe.paddingRight}px`,
      }}
    >
      <div
        style={{
          width: cardW,
          borderRadius: 22 * u,
          background: palette.window,
          border: `1px solid ${palette.border}`,
          boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${26 * u}px ${
            64 * u
          }px ${palette.shadow}`,
          padding: `${26 * u}px ${30 * u}px ${28 * u}px`,
          // The card wipes open from its own top edge, then drops away.
          clipPath: `inset(0 0 ${(1 - open) * 100}% 0 round ${22 * u}px)`,
          opacity: 1 - exit,
          translate: `0 ${(1 - card) * 26 * u + exit * 34 * u}px`,
        }}
      >
        {title ? (
          <div style={{ overflow: "hidden", paddingBottom: "0.06em" }}>
            <div
              style={{
                color: palette.fg,
                fontSize: 30 * u,
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                translate: `0 ${(1 - titleIn) * 100}%`,
              }}
            >
              {title}
            </div>
          </div>
        ) : null}

        {subtitle ? (
          <div
            style={{
              marginTop: 5 * u,
              color: palette.dim,
              fontSize: 17 * u,
              fontWeight: 500,
              opacity: subtitleIn,
            }}
          >
            {subtitle}
          </div>
        ) : null}

        <div
          style={{
            marginTop: 20 * u,
            display: "flex",
            flexDirection: "column",
            gap: 13 * u,
          }}
        >
          {fields.map((field, index) => {
            const beat = schedule[index];
            const rowAt = T.rows + T.rowStagger * index;
            const rowIn = ease(rowAt, rowAt + 0.42);
            const typed = ease(beat.start, beat.done, EASING.editorial);
            const shown = field.value.slice(
              0,
              Math.round(typed * field.value.length),
            );
            const check = ease(beat.done, beat.done + T.checkFor, EASING.editorial);
            // Focused between the caret landing and the tick finishing; the
            // ring has to leave before the next field claims it.
            const focus =
              ease(beat.start - 0.1, beat.start + 0.14) *
              (1 - ease(beat.done + T.checkFor, beat.done + T.checkFor + 0.16));

            return (
              <div
                key={field.label}
                style={{
                  opacity: rowIn,
                  translate: `0 ${(1 - rowIn) * 10 * u}px`,
                }}
              >
                <div
                  style={{
                    marginBottom: 6 * u,
                    color: palette.dim,
                    fontSize: 14.5 * u,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {field.label}
                </div>
                <div
                  style={{
                    position: "relative",
                    height: 46 * u,
                    display: "flex",
                    alignItems: "center",
                    padding: `0 ${14 * u}px`,
                    borderRadius: 11 * u,
                    background: palette.band,
                    // Focus ring and valid border are separate states: the ring
                    // is the accent, the settled border is the valid colour.
                    border: `1px solid ${
                      focus > 0.1
                        ? accentColor
                        : check > 0.5
                          ? `${validColor}7A`
                          : palette.border
                    }`,
                    boxShadow:
                      focus > 0.01
                        ? `0 0 0 ${3 * u * focus}px ${accentColor}33`
                        : "none",
                  }}
                >
                  <span
                    style={{
                      color: shown.length > 0 ? palette.fg : palette.faint,
                      fontSize: 19 * u,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    {shown.length > 0 ? shown : (field.placeholder ?? "")}
                  </span>
                  {/* Caret sits at the end of the typed run while the field
                      has focus, and blinks on its own half-second clock. */}
                  <span
                    style={{
                      marginLeft: 2 * u,
                      width: 2 * u,
                      height: 21 * u,
                      background: accentColor,
                      opacity: focus > 0.5 && caretOn ? 1 : 0,
                    }}
                  />
                  <span style={{ flex: 1 }} />
                  <span
                    style={{
                      display: "flex",
                      opacity: check,
                      scale: `${interpolate(check, [0, 1], [0.7, 1])}`,
                    }}
                  >
                    <CheckGlyph size={20 * u} color={validColor} progress={check} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 20 * u,
            height: 48 * u,
            borderRadius: 12 * u,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9 * u,
            // Disabled until the last field validates, so the button reads as
            // a consequence of the form rather than as decoration.
            background: `${accentColor}${armed > 0.5 ? "" : "1F"}`,
            opacity: interpolate(armed, [0, 1], [0.55, 1]),
            color: armed > 0.5 ? "#0B0C11" : palette.dim,
            fontSize: 19 * u,
            fontWeight: 600,
            scale: `${interpolate(
              success,
              [0, 0.5, 1],
              [1, 1.03, 1],
            )}`,
          }}
        >
          {success > 0.5 ? (
            <CheckGlyph size={20 * u} color="#0B0C11" progress={success} />
          ) : null}
          {success > 0.5 ? successLabel : submitLabel}
        </div>
      </div>
    </AbsoluteFill>
  );
};
