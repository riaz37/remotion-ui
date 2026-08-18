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
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export type ChangeKind = "added" | "fixed" | "changed" | "removed";

export type ChangeRow = {
  kind: ChangeKind;
  text: string;
};

export type ChangelogEntryProps = {
  /** Version string in the header. */
  version?: string;
  /** Date printed beside the version. */
  date?: string;
  /** Line under the version, if this release has a headline. */
  summary?: string;
  changes?: ChangeRow[];
  /** Tag colours per kind. Any missing kind falls back to the accent. */
  kindColors?: Partial<Record<ChangeKind, string>>;
  /** Second the first change row arrives. */
  startAtSeconds?: number;
  /** Seconds between rows. */
  staggerSeconds?: number;
  /**
   * Seconds the finished entry holds before it retreats. Omit to leave it up
   * for the rest of the scene.
   */
  holdSeconds?: number;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_CHANGES: ChangeRow[] = [
  { kind: "added", text: "Caption presets for nine languages" },
  { kind: "added", text: "Render API webhooks on job completion" },
  { kind: "fixed", text: "Retry backoff no longer stalls the queue" },
  { kind: "changed", text: "Theme tokens moved to a single source" },
  { kind: "removed", text: "Legacy waveform atom" },
];

const DEFAULT_KIND_COLORS: Record<ChangeKind, string> = {
  added: "#9BD4A0",
  fixed: "#7DD3E8",
  changed: "#E8B86D",
  removed: "#E89B9B",
};

/** Beat plan in seconds. Row times come from the props. */
const T = {
  card: 0,
  cardFor: 0.46,
  version: 0.12,
  versionFor: 0.44,
  rule: 0.34,
  ruleFor: 0.5,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * A release note that reads itself out: the version lands first, a rule draws
 * under it, then each change arrives behind its own coloured tag so the kind of
 * change registers before the sentence does.
 *
 * Tags are fixed width rather than sized to their label, which is what lets the
 * sentences share a left edge — a column of ragged text beside ragged tags is
 * the fastest way to make a changelog look unmaintained.
 */
export const ChangelogEntry: React.FC<ChangelogEntryProps> = ({
  version = "v2.4.0",
  date = "16 August",
  summary = "Captions, webhooks, and a queue that stops sulking.",
  changes = DEFAULT_CHANGES,
  kindColors,
  startAtSeconds = 0.66,
  staggerSeconds = 0.28,
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
  // D1. Authored against a 1280x720 reference, u resolves to 0.75 on the 960
  // docs stage, so a 15-unit label landed at 11px — 3.6px once the contact
  // sheet reduces the stage 3.1x. The reference is the whole design's scale, so
  // shrinking it grows the layout into the margin it was leaving empty and
  // lifts every tier of type with it, instead of hand-tuning font sizes against
  // a layout that stays too small.
  const u = portrait
    ? Math.min(width / 496, height / 896)
    : Math.min(width / 1024, height / 576);

  const cardIn = spring({
    frame: frame - at(T.card),
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });
  const open = ease(T.card, T.card + T.cardFor, EASING.editorial);
  const versionIn = ease(T.version, T.version + T.versionFor);
  const ruleIn = ease(T.rule, T.rule + T.ruleFor, EASING.editorial);

  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const cardW = Math.min(width - safe.paddingLeft - safe.paddingRight, 760 * u);
  const pad = 30 * u;
  const tagW = 74 * u;

  const colorFor = (kind: ChangeKind) =>
    kindColors?.[kind] ?? DEFAULT_KIND_COLORS[kind] ?? accentColor;

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
          borderRadius: 20 * u,
          background: palette.window,
          border: `1px solid ${palette.border}`,
          boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${24 * u}px ${
            60 * u
          }px ${palette.shadow}`,
          padding: pad,
          overflow: "hidden",
          clipPath: `inset(0 0 ${(1 - open) * 100}% 0 round ${20 * u}px)`,
          opacity: 1 - exit,
          translate: `0 ${(1 - cardIn) * 22 * u + exit * 30 * u}px`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12 * u,
            opacity: versionIn,
            translate: `0 ${(1 - versionIn) * 12 * u}px`,
          }}
        >
          <span
            style={{
              color: palette.fg,
              fontSize: 38 * u,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {version}
          </span>
          {date ? (
            <span
              style={{
                color: palette.dim,
                fontSize: 15 * u,
                fontWeight: 500,
              }}
            >
              {date}
            </span>
          ) : null}
        </div>

        {summary ? (
          <div
            style={{
              marginTop: 6 * u,
              color: palette.dim,
              fontSize: 16.5 * u,
              fontWeight: 500,
              opacity: interpolate(versionIn, [0.4, 1], [0, 1], clamp),
            }}
          >
            {summary}
          </div>
        ) : null}

        {/* The rule draws out from the left rather than fading — it reads as the
            header being underlined, which is a beat, not a transition. */}
        <div
          style={{
            marginTop: 18 * u,
            marginBottom: 18 * u,
            height: 1,
            width: `${ruleIn * 100}%`,
            background: palette.border,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 * u }}>
          {changes.map((change, index) => {
            const rowAt = startAtSeconds + index * staggerSeconds;
            const rowIn = ease(rowAt, rowAt + 0.4);
            // The tag lands before its sentence: the kind of change is what a
            // viewer scans for, so it gets the earlier frames.
            const textIn = ease(rowAt + 0.08, rowAt + 0.46);
            const color = colorFor(change.kind);

            return (
              <div
                key={`${change.kind}-${change.text}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14 * u,
                  opacity: rowIn,
                }}
              >
                <span
                  style={{
                    width: tagW,
                    flexShrink: 0,
                    textAlign: "center",
                    padding: `${4 * u}px 0`,
                    borderRadius: 7 * u,
                    background: `${color}1E`,
                    border: `1px solid ${color}55`,
                    color,
                    fontSize: 14.5 * u,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    scale: `${0.9 + rowIn * 0.1}`,
                  }}
                >
                  {change.kind}
                </span>
                <span
                  style={{
                    color: palette.fg,
                    fontSize: 17 * u,
                    fontWeight: 500,
                    opacity: textIn,
                    translate: `${(1 - textIn) * 10 * u}px`,
                  }}
                >
                  {change.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
