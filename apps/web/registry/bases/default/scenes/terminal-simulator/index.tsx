import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Caret, stageScale } from "@/remotion/lib/ai-composer-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

/** Reference stage the terminal is laid out against, then uniformly scaled. */
const REF_WIDTH = 1280;
const REF_HEIGHT = 720;

const WINDOW_WIDTH = 940;
const HEADER_HEIGHT = 46;
const BODY_PADDING = 28;
/** Fixed log viewport — overflowing rows scroll like a real terminal. */
const BODY_HEIGHT = 336;
const ROW_HEIGHT = 34;
const FONT_SIZE = 21;
const GLYPH_COLUMN = 30;

/** Characters per second the command is typed at. */
const TYPING_CPS = 26;

/** Length of the retreat once `holdSeconds` is up, in seconds. */
const EXIT_FOR = 0.42;

export type TerminalStepTone = "info" | "success" | "warn" | "error";

export type TerminalStep = {
  /** Log text printed once the step starts. */
  text: string;
  /** How the step resolves — drives its glyph and colour. */
  tone?: TerminalStepTone;
  /** Right-aligned timing badge revealed on resolve, e.g. `"412ms"`. */
  duration?: string;
  /** Seconds the step spins before resolving. `info` steps never spin. */
  work?: number;
};

export type TerminalSimulatorProps = {
  /** Command typed at the prompt before anything runs. */
  command?: string;
  /** Steps printed one after another once the command is submitted. */
  steps?: TerminalStep[];
  /** Dim line printed after the last step, before the prompt returns. */
  summary?: string;
  /** Prompt prefix, e.g. a working directory. */
  prompt?: string;
  /** Window title in the header chrome. */
  title?: string;
  /** Shell label on the right of the header. */
  shell?: string;
  accentColor?: string;
  /** Overrides the page background behind the window. */
  backgroundColor?: string;
  theme?: "dark" | "light";
  /**
   * Seconds the finished build holds before the window retreats. Omit to leave
   * it up for the rest of the scene — inside a `TransitionSeries` the
   * transition should cover the tail rather than the window fading under it.
   */
  holdSeconds?: number;
  /** Animation speed multiplier. */
  speed?: number;
  /**
   * Multiplies the fitted stage scale. The window is laid out against a
   * 1280×720 reference, which puts the 21px log type under 5px once a 960-wide
   * preview is reduced to a 308px tile — raise this when the command has to
   * survive that reduction.
   */
  zoom?: number;
};

type Palette = {
  page: string;
  window: string;
  header: string;
  border: string;
  highlight: string;
  fg: string;
  dim: string;
  faint: string;
  success: string;
  warn: string;
  error: string;
  shadow: string;
};

const TERMINAL_THEMES: Record<"dark" | "light", Palette> = {
  dark: {
    page: "#07070B",
    window: "#0B0C11",
    header: "rgba(255,255,255,0.035)",
    border: "rgba(255,255,255,0.09)",
    highlight: "rgba(255,255,255,0.14)",
    fg: "#D8DCE4",
    dim: "#7A828F",
    faint: "#4A5160",
    success: "#34D399",
    warn: "#FBBF24",
    error: "#F87171",
    shadow: "rgba(0,0,0,0.55)",
  },
  light: {
    page: "#F4F4F2",
    window: "#FFFFFF",
    header: "rgba(0,0,0,0.025)",
    border: "rgba(0,0,0,0.10)",
    highlight: "rgba(255,255,255,0.9)",
    fg: "#22252B",
    dim: "#6B7280",
    faint: "#A0A6B0",
    success: "#0E9F6E",
    warn: "#B45309",
    error: "#DC2626",
    shadow: "rgba(15,18,25,0.18)",
  },
};

const CHROME_LIGHTS = ["#FF5F57", "#FEBC2E", "#28C840"] as const;

/**
 * Prompt chevron and summary arrow are drawn, not typed. `❯` and `➜` are not
 * guaranteed to exist in the loaded mono face, and a tofu box in a headless
 * render is the kind of bug nobody catches until the video ships.
 */
const Chevron: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M8.5 5.5L15.5 12l-7 6.5"
      stroke={color}
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Arrow: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 12h15M13.5 6.5L19.5 12l-6 5.5"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DEFAULT_STEPS: TerminalStep[] = [
  { text: "resolving registry items", duration: "128ms" },
  { text: "compiling 6 scene blocks", duration: "1.4s", work: 0.6 },
  { text: "emitting public registry JSON", duration: "212ms" },
  { text: "validating peer dependencies", duration: "94ms" },
];

function toneColor(tone: TerminalStepTone, palette: Palette): string {
  switch (tone) {
    case "warn":
      return palette.warn;
    case "error":
      return palette.error;
    case "info":
      return palette.dim;
    default:
      return palette.success;
  }
}

/**
 * Rotating arc shown while a step is still working. Drawn rather than typed so
 * it never depends on a braille glyph being present in the loaded font.
 */
const Spinner: React.FC<{ size: number; color: string; turn: number }> = ({
  size,
  color,
  turn,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ transform: `rotate(${turn}deg)` }}
  >
    <circle
      cx={12}
      cy={12}
      r={9}
      stroke={color}
      strokeOpacity={0.28}
      strokeWidth={2.5}
    />
    <path
      d="M12 3a9 9 0 0 1 9 9"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
    />
  </svg>
);

/** Resolve glyph — the check strokes itself on, warn/error cross-fade in. */
const ResolvedGlyph: React.FC<{
  size: number;
  color: string;
  tone: TerminalStepTone;
  progress: number;
}> = ({ size, color, tone, progress }) => {
  if (tone === "info") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M8 6l6 6-6 6"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={progress}
        />
      </svg>
    );
  }

  if (tone === "success") {
    const length = 22;
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M4.5 12.5l5 5 10-11"
          stroke={color}
          strokeWidth={2.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - progress)}
        />
      </svg>
    );
  }

  const glyph =
    tone === "warn" ? (
      <path
        d="M12 4.5l8.5 15h-17l8.5-15zM12 10v4.5M12 17.2v.1"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : (
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        opacity: progress,
        transform: `scale(${0.7 + progress * 0.3})`,
      }}
    >
      {glyph}
    </svg>
  );
};

export const TerminalSimulator: React.FC<TerminalSimulatorProps> = ({
  command = "pnpm registry:build",
  steps = DEFAULT_STEPS,
  summary = "6 blocks · 1.9 MB · done in 4.2s",
  prompt = "~/remotion-ui",
  title = "Build output",
  shell = "zsh",
  accentColor = "#E8B86D",
  backgroundColor,
  theme = "dark",
  holdSeconds,
  speed = 1,
  zoom = 1,
}) => {
  const rawFrame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const palette = TERMINAL_THEMES[theme];
  const page = backgroundColor ?? palette.page;
  const scale = stageScale(width, height, REF_WIDTH, REF_HEIGHT) * zoom;
  const frame = rawFrame * speed;

  const seconds = (value: number) => value * fps;
  const clamp = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };

  // --- Timeline -----------------------------------------------------------
  const typeStart = seconds(0.45);
  const typeFrames = (command.length / TYPING_CPS) * fps;
  const submitAt = typeStart + typeFrames + seconds(0.34);

  let cursor = submitAt + seconds(0.22);
  const timeline = steps.map((step) => {
    const startsAt = cursor;
    const work = step.tone === "info" ? 0.14 : (step.work ?? 0.42);
    const resolvesAt = startsAt + seconds(work);
    cursor = resolvesAt + seconds(0.14);
    return { step, startsAt, resolvesAt };
  });

  const summaryAt = cursor + seconds(0.18);
  const returnAt = summaryAt + seconds(summary ? 0.3 : 0);

  // --- Window -------------------------------------------------------------
  const enter = spring({
    fps,
    frame,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });
  const chromeIn = interpolate(
    frame,
    [seconds(0.12), seconds(0.42)],
    [0, 1],
    { easing: EASING.enter, ...clamp },
  );

  // Exits accelerate away; entrances decelerate in. Never ease-out an exit.
  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(
          frame,
          [seconds(holdSeconds), seconds(holdSeconds + EXIT_FOR)],
          [0, 1],
          { easing: EASING.exit, ...clamp },
        );

  // The room warms as the build lands.
  const bloom = interpolate(
    frame,
    [summaryAt - seconds(0.12), summaryAt + seconds(0.6)],
    [0.45, 1],
    { easing: EASING.enter, ...clamp },
  );

  // --- Command line -------------------------------------------------------
  const typedCount = Math.max(
    0,
    Math.min(
      command.length,
      Math.floor(((frame - typeStart) / typeFrames) * command.length),
    ),
  );
  const typedText = command.slice(0, typedCount);
  const submitted = frame >= submitAt;
  const submitPulse = interpolate(
    frame,
    [submitAt, submitAt + seconds(0.18)],
    [1, 0],
    clamp,
  );

  // --- Scroll -------------------------------------------------------------
  // Rows grow fractionally as they appear so the viewport pans instead of
  // jumping a whole line-height every time a step prints.
  const growth = (at: number) =>
    interpolate(frame, [at, at + 6], [0, 1], { easing: EASING.enter, ...clamp });

  const summaryGrowth = summary ? growth(summaryAt) : 0;
  const promptGrowth = growth(returnAt);
  const rowCount =
    1 +
    timeline.reduce((total, entry) => total + growth(entry.startsAt), 0) +
    summaryGrowth * 2 +
    promptGrowth;
  const viewportHeight = BODY_HEIGHT - BODY_PADDING * 2;
  const scrollY = Math.max(0, rowCount * ROW_HEIGHT - viewportHeight);
  const summaryVisible = summaryGrowth > 0;
  const promptBack = promptGrowth > 0;

  const glyphSize = FONT_SIZE * 0.86;

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    height: ROW_HEIGHT,
    gap: 0,
  };

  return (
    <div
      style={{
        width,
        height,
        background: page,
        fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 70% 50% at 50% 38%, ${accentColor}1F, transparent 70%)`,
          opacity: bloom * chromeIn,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            theme === "dark"
              ? "radial-gradient(ellipse 120% 90% at 50% 50%, transparent 45%, rgba(0,0,0,0.55) 100%)"
              : "radial-gradient(ellipse 120% 90% at 50% 50%, transparent 55%, rgba(15,18,25,0.07) 100%)",
        }}
      />

      <div
        style={{
          width: WINDOW_WIDTH,
          // Compound and order-dependent, so it stays a transform string:
          // scaling after the translate would scale the travel too.
          transform: `scale(${scale * interpolate(enter, [0, 1], [0.965, 1])}) translateY(${interpolate(enter, [0, 1], [26, 0]) - exit * 26}px)`,
          opacity: enter * (1 - exit),
          borderRadius: 16,
          background: palette.window,
          border: `1px solid ${palette.border}`,
          boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 34px 90px ${palette.shadow}`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Header chrome */}
        <div
          style={{
            height: HEADER_HEIGHT,
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            borderBottom: `1px solid ${palette.border}`,
            background: palette.header,
          }}
        >
          <div style={{ display: "flex", gap: 8, opacity: chromeIn }}>
            {CHROME_LIGHTS.map((color) => (
              <div
                key={color}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background: color,
                }}
              />
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              textAlign: "center",
              color: palette.dim,
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: 0.2,
              opacity: chromeIn,
              pointerEvents: "none",
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginLeft: "auto",
              color: palette.faint,
              fontSize: 13,
              letterSpacing: 0.6,
              opacity: chromeIn,
            }}
          >
            {shell}
          </div>
        </div>

        {/* Log viewport */}
        <div
          style={{
            height: BODY_HEIGHT,
            padding: BODY_PADDING,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              transform: `translateY(${-scrollY}px)`,
              fontSize: FONT_SIZE,
              lineHeight: 1,
              color: palette.fg,
            }}
          >
            {/* Typed command */}
            <div style={rowStyle}>
              <span style={{ color: palette.faint, marginRight: 10 }}>
                {prompt}
              </span>
              <span style={{ marginRight: 8, display: "flex" }}>
                <Chevron size={FONT_SIZE} color={accentColor} />
              </span>
              <span style={{ whiteSpace: "pre" }}>{typedText}</span>
              {submitted ? null : (
                <Caret
                  color={accentColor}
                  width={FONT_SIZE * 0.52}
                  height={FONT_SIZE * 1.15}
                  radius={2}
                  blink={typedCount === 0}
                  blinkPerSecond={1.6}
                  speed={speed}
                  marginLeft={2}
                />
              )}
              {submitted && submitPulse > 0 ? (
                <span
                  style={{
                    display: "inline-block",
                    marginLeft: 4,
                    width: FONT_SIZE * 0.52,
                    height: FONT_SIZE * 1.15,
                    borderRadius: 2,
                    background: accentColor,
                    opacity: submitPulse * 0.55,
                    transform: `scaleX(${1 + (1 - submitPulse) * 1.8})`,
                  }}
                />
              ) : null}
            </div>

            {/* Steps */}
            {timeline.map(({ step, startsAt, resolvesAt }, index) => {
              if (frame < startsAt) return null;
              const tone = step.tone ?? "success";
              const color = toneColor(tone, palette);
              const appear = interpolate(
                frame,
                [startsAt, startsAt + 3],
                [0, 1],
                clamp,
              );
              const resolved = frame >= resolvesAt;
              const resolveProgress = interpolate(
                frame,
                [resolvesAt, resolvesAt + seconds(0.22)],
                [0, 1],
                { easing: EASING.enter, ...clamp },
              );
              const turn = ((frame - startsAt) / fps) * 620;

              return (
                <div
                  key={`${step.text}-${index}`}
                  style={{ ...rowStyle, opacity: appear }}
                >
                  <span
                    style={{
                      width: GLYPH_COLUMN,
                      display: "flex",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {resolved ? (
                      <ResolvedGlyph
                        size={glyphSize}
                        color={color}
                        tone={tone}
                        progress={resolveProgress}
                      />
                    ) : (
                      <Spinner
                        size={glyphSize}
                        color={accentColor}
                        turn={turn}
                      />
                    )}
                  </span>
                  <span
                    style={{
                      color: resolved ? palette.fg : palette.dim,
                      whiteSpace: "pre",
                    }}
                  >
                    {step.text}
                  </span>
                  {step.duration ? (
                    <span
                      style={{
                        marginLeft: "auto",
                        color: palette.faint,
                        fontSize: FONT_SIZE * 0.78,
                        fontVariantNumeric: "tabular-nums",
                        opacity: resolveProgress,
                      }}
                    >
                      {step.duration}
                    </span>
                  ) : null}
                </div>
              );
            })}

            {/* Summary */}
            {summaryVisible ? (
              <>
                <div style={{ height: ROW_HEIGHT * summaryGrowth }} />
                <div
                  style={{
                    ...rowStyle,
                    opacity: interpolate(
                      frame,
                      [summaryAt, summaryAt + seconds(0.25)],
                      [0, 1],
                      { easing: EASING.enter, ...clamp },
                    ),
                  }}
                >
                  <span
                    style={{
                      width: GLYPH_COLUMN,
                      display: "flex",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Arrow size={FONT_SIZE * 0.92} color={accentColor} />
                  </span>
                  <span
                    style={{
                      color: palette.dim,
                      whiteSpace: "pre",
                      fontSize: FONT_SIZE * 0.92,
                    }}
                  >
                    {summary}
                  </span>
                </div>
              </>
            ) : null}

            {/* Prompt returns — the real "done" signal */}
            {promptBack ? (
              <div
                style={{
                  ...rowStyle,
                  opacity: interpolate(
                    frame,
                    [returnAt, returnAt + seconds(0.2)],
                    [0, 1],
                    clamp,
                  ),
                }}
              >
                <span style={{ color: palette.faint, marginRight: 10 }}>
                  {prompt}
                </span>
                <span style={{ marginRight: 8, display: "flex" }}>
                  <Chevron size={FONT_SIZE} color={accentColor} />
                </span>
                <Caret
                  color={accentColor}
                  width={FONT_SIZE * 0.52}
                  height={FONT_SIZE * 1.15}
                  radius={2}
                  blink
                  blinkPerSecond={1.6}
                  speed={speed}
                />
              </div>
            ) : null}
          </div>

          {/* Top fade so scrolled rows dissolve out rather than clip */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: BODY_PADDING + ROW_HEIGHT * 0.6,
              background: `linear-gradient(${palette.window}, ${palette.window}00)`,
              opacity: Math.min(1, scrollY / 12),
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
};
