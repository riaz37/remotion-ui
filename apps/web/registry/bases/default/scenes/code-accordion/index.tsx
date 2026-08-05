import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { stageScale } from "@/remotion/lib/ai-composer-utils";
import {
  CODE_THEMES,
  CodeLine,
  lineLength,
  MONO_ADVANCE,
  tokenizeCode,
} from "@/remotion/lib/code-syntax";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

/** Reference stage the panel is laid out against, then uniformly scaled. */
const REF_WIDTH = 1280;
const REF_HEIGHT = 720;

const PANEL_WIDTH = 880;
const HEADER_HEIGHT = 64;
const CODE_ROW_HEIGHT = 32;
const CODE_FONT_SIZE = 19;
const CODE_PADDING = 16;
const CODE_INSET = 62;

/** Characters per second each step's code is written at. */
const WRITE_CPS = 70;

export type AccordionSection = {
  /** Step label shown on the collapsed row. */
  title: string;
  /** Code revealed while the step is open. */
  code: string;
  /** Optional right-aligned hint, e.g. a filename. */
  meta?: string;
};

export type CodeAccordionProps = {
  /** Steps played in order. */
  sections?: AccordionSection[];
  /**
   * Plays a single step instead of walking the list — it opens and stays open.
   * Leave it unset to step through every section in order.
   */
  activeIndex?: number;
  /** Label above the steps. */
  title?: string;
  /** Seconds an opened step is held before it closes. */
  holdSeconds?: number;
  accentColor?: string;
  /** Overrides the page background behind the panel. */
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_SECTIONS: AccordionSection[] = [
  {
    title: "Install the scene",
    code: "npx remotion-ui add code-accordion",
    meta: "terminal",
  },
  {
    title: "Import it",
    code: 'import { CodeAccordion } from "@/remotion/scenes/code-accordion";',
    meta: "Root.tsx",
  },
  {
    title: "Render the steps",
    code: "<CodeAccordion sections={sections} />",
    meta: "Root.tsx",
  },
];

/** Drawn, not typed — a chevron glyph is not guaranteed in the mono face. */
const Chevron: React.FC<{ size: number; color: string; turn: number }> = ({
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
    <path
      d="M8.5 5.5L15.5 12l-7 6.5"
      stroke={color}
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Check that strokes itself on as a step is put behind us. */
const Check: React.FC<{ size: number; color: string; progress: number }> = ({
  size,
  color,
  progress,
}) => {
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
};

/**
 * Code accordion staged as the walkthrough it stands in for: each step opens in
 * turn, writes its code, is checked off, and closes behind the next one — so
 * the viewer reads a sequence of moves rather than one frozen open drawer.
 */
export const CodeAccordion: React.FC<CodeAccordionProps> = ({
  sections = DEFAULT_SECTIONS,
  activeIndex,
  title = "Add it to your project",
  holdSeconds = 0.75,
  accentColor = "#E8B86D",
  backgroundColor,
  theme = "dark",
  speed = 1,
}) => {
  const rawFrame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const page = backgroundColor ?? palette.page;
  const scale = stageScale(width, height, REF_WIDTH, REF_HEIGHT);
  const frame = rawFrame * speed;

  const seconds = (value: number) => value * fps;
  const clamp = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };

  // A single pinned step never closes — it is the whole scene.
  const pinned =
    activeIndex === undefined
      ? undefined
      : Math.min(Math.max(activeIndex, 0), Math.max(sections.length - 1, 0));

  // --- Step plan ----------------------------------------------------------
  let cursorFrame = seconds(0.45);
  const plan = sections.map((section, index) => {
    const lines = section.code.replace(/\s+$/, "").split("\n");
    const tokens = tokenizeCode(lines);
    const chars = tokens.reduce((total, line) => total + lineLength(line), 0);
    const plays = pinned === undefined || pinned === index;

    if (!plays) {
      return {
        section,
        lines,
        tokens,
        plays,
        opensAt: 0,
        writeStart: 0,
        closesAt: 0,
      };
    }

    const opensAt = cursorFrame;
    // Writing waits for the fold to finish opening — text emerging through a
    // moving clip edge reads as a glitch, not as typing.
    const writeStart = opensAt + seconds(0.36);
    const writeEnd = writeStart + (chars / WRITE_CPS) * fps;
    // Stepping through, a step closes to make room; a pinned one stays open.
    const closesAt =
      pinned === undefined
        ? writeEnd + seconds(holdSeconds)
        : Number.POSITIVE_INFINITY;
    cursorFrame = closesAt + seconds(0.22);

    return { section, lines, tokens, plays, opensAt, writeStart, closesAt };
  });

  const panelEnter = spring({
    fps,
    frame,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });
  const titleIn = interpolate(frame, [seconds(0.12), seconds(0.5)], [0, 1], {
    easing: EASING.enter,
    ...clamp,
  });

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
          background: `radial-gradient(ellipse 70% 50% at 50% 38%, ${accentColor}1C, transparent 70%)`,
          opacity: titleIn,
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
          width: PANEL_WIDTH,
          transform: `scale(${scale * interpolate(panelEnter, [0, 1], [0.965, 1])}) translateY(${interpolate(panelEnter, [0, 1], [26, 0])}px)`,
          opacity: panelEnter,
        }}
      >
        {title ? (
          <div
            style={{
              color: palette.dim,
              fontSize: 17,
              fontWeight: 500,
              letterSpacing: 0.4,
              marginBottom: 16,
              paddingLeft: 4,
              opacity: titleIn,
            }}
          >
            {title}
          </div>
        ) : null}

        <div
          style={{
            borderRadius: 16,
            background: palette.window,
            border: `1px solid ${palette.border}`,
            boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 34px 90px ${palette.shadow}`,
            overflow: "hidden",
          }}
        >
          {plan.map((step, index) => {
            const rowIn = interpolate(
              frame,
              [seconds(0.12) + index * 4, seconds(0.42) + index * 4],
              [0, 1],
              { easing: EASING.enter, ...clamp },
            );
            const open = step.plays
              ? interpolate(
                  frame,
                  [step.opensAt, step.opensAt + seconds(0.32)],
                  [0, 1],
                  { easing: EASING.enter, ...clamp },
                )
              : 0;
            // A pinned step's `closesAt` is Infinity — it never closes, and
            // an infinite input range would throw.
            const close =
              step.plays && Number.isFinite(step.closesAt)
                ? interpolate(
                    frame,
                    [step.closesAt, step.closesAt + seconds(0.28)],
                    [0, 1],
                    { easing: EASING.exit, ...clamp },
                  )
                : 0;
            const expansion = open * (1 - close);
            const done = close > 0;
            const active = expansion > 0.02;
            const contentHeight =
              step.lines.length * CODE_ROW_HEIGHT + CODE_PADDING * 2;

            return (
              <div
                key={step.section.title}
                style={{
                  borderBottom:
                    index < plan.length - 1
                      ? `1px solid ${palette.border}`
                      : "none",
                  opacity: rowIn,
                  background: active ? palette.gutter : "transparent",
                }}
              >
                <div
                  style={{
                    height: HEADER_HEIGHT,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 22px",
                    gap: 16,
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {done ? (
                      <Check
                        size={20}
                        color={palette.token.string}
                        progress={close}
                      />
                    ) : (
                      <Chevron
                        size={18}
                        color={active ? accentColor : palette.faint}
                        turn={expansion * 90}
                      />
                    )}
                  </span>
                  <span
                    style={{
                      color: active
                        ? palette.fg
                        : done
                          ? palette.dim
                          : palette.faint,
                      fontSize: 21,
                      fontWeight: 500,
                      letterSpacing: 0.1,
                    }}
                  >
                    {step.section.title}
                  </span>
                  {step.section.meta ? (
                    <span
                      style={{
                        marginLeft: "auto",
                        color: palette.faint,
                        fontSize: 14,
                        letterSpacing: 0.4,
                        opacity: active ? 1 : 0.55,
                      }}
                    >
                      {step.section.meta}
                    </span>
                  ) : null}
                </div>

                <div
                  style={{
                    height: contentHeight * expansion,
                    overflow: "hidden",
                    background: `${accentColor}0A`,
                  }}
                >
                  <div
                    style={{
                      paddingTop: CODE_PADDING,
                      paddingBottom: CODE_PADDING,
                      paddingLeft: CODE_INSET,
                      fontSize: CODE_FONT_SIZE,
                      lineHeight: `${CODE_ROW_HEIGHT}px`,
                      // The block slides up out of the fold rather than
                      // stretching, so the type never distorts.
                      transform: `translateY(${(expansion - 1) * 10}px)`,
                    }}
                  >
                    {step.tokens.map((tokens, lineIndex) => {
                      const raw = step.lines[lineIndex];
                      const indent = raw.length - raw.trimStart().length;
                      const cost = Math.max(0, raw.length - indent);
                      const before = step.lines
                        .slice(0, lineIndex)
                        .reduce((total, line) => total + line.length, 0);
                      const lineStart =
                        step.writeStart + (before / WRITE_CPS) * fps;
                      const written =
                        indent +
                        Math.round(
                          interpolate(
                            frame,
                            [lineStart, lineStart + (cost / WRITE_CPS) * fps + 1],
                            [0, cost],
                            clamp,
                          ),
                        );

                      const complete = written >= raw.length;

                      return (
                        <div
                          key={`${lineIndex}-${raw}`}
                          style={{ display: "flex", alignItems: "center" }}
                        >
                          <span style={{ position: "relative" }}>
                            <CodeLine
                              tokens={tokens}
                              theme={palette}
                              reveal={complete ? undefined : written}
                            />
                            {frame >= lineStart && !complete ? (
                              <span
                                style={{
                                  position: "absolute",
                                  top: "50%",
                                  left: written * CODE_FONT_SIZE * MONO_ADVANCE,
                                  width: CODE_FONT_SIZE * MONO_ADVANCE * 0.9,
                                  height: CODE_FONT_SIZE * 1.15,
                                  transform: "translateY(-50%)",
                                  borderRadius: 2,
                                  background: accentColor,
                                }}
                              />
                            ) : null}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
