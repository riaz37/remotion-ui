import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Caret, stageScale } from "@/remotion/lib/ai-composer-utils";
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

/** Reference stage the editor is laid out against, then uniformly scaled. */
const REF_WIDTH = 1280;
const REF_HEIGHT = 720;

const WINDOW_WIDTH = 940;
const HEADER_HEIGHT = 46;
const BODY_PADDING = 24;
const ROW_HEIGHT = 34;
const FONT_SIZE = 21;
const GUTTER_WIDTH = 62;
const CODE_INSET = 20;
/** Longest listing shown at once — anything past this scrolls. */
const MAX_VISIBLE_ROWS = 10;

/** Characters per second the code is written at. */
const WRITE_CPS = 55;
/** Beat spent moving to the next line, in seconds. */
const NEWLINE_PAUSE = 0.07;

const DEFAULT_CODE = `import { CodeReveal } from "@/remotion/scenes/code-reveal";

export const Explainer = () => (
  <CodeReveal
    title="pipeline.ts"
    highlightedLines={[4, 5]}
  />
);`;

export type CodeRevealProps = {
  /** Source shown in the editor. Surrounding blank lines are trimmed. */
  code?: string;
  /** 1-based line numbers focused once the listing finishes writing. */
  highlightedLines?: number[];
  /** Filename on the editor tab. */
  title?: string;
  /** Language badge on the right of the header. */
  language?: string;
  /** First line number in the gutter — set it when showing an excerpt. */
  startLine?: number;
  /** Hides the gutter entirely when false. */
  showLineNumbers?: boolean;
  accentColor?: string;
  /** Overrides the page background behind the window. */
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const CHROME_LIGHTS = ["#FF5F57", "#FEBC2E", "#28C840"] as const;

/**
 * Code reveal staged as an editor actually writing the file: a write head runs
 * through the listing character by character with the caret riding its tip,
 * then — once the file is complete — attention lands on the lines that matter
 * and the rest of the listing recedes.
 */
export const CodeReveal: React.FC<CodeRevealProps> = ({
  code = DEFAULT_CODE,
  highlightedLines = [],
  title = "explainer.tsx",
  language = "tsx",
  startLine = 1,
  showLineNumbers = true,
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

  const lines = code.replace(/\s+$/, "").replace(/^\n+/, "").split("\n");
  const tokenLines = tokenizeCode(lines);
  const focused = new Set(highlightedLines);
  const hasFocus = highlightedLines.length > 0;

  // --- Write plan ---------------------------------------------------------
  // Leading indentation is free — editors auto-indent, so only the characters
  // a person actually types cost time. Each row carries a short newline beat.
  const writeStart = seconds(0.4);
  let cursorFrame = writeStart;
  const plan = tokenLines.map((tokens, index) => {
    const raw = lines[index];
    const indent = raw.length - raw.trimStart().length;
    const cost = Math.max(0, lineLength(tokens) - indent);
    const startsAt = cursorFrame;
    const endsAt = startsAt + (cost / WRITE_CPS) * fps;
    cursorFrame = endsAt + seconds(NEWLINE_PAUSE);
    return { tokens, indent, cost, startsAt, endsAt };
  });

  const writeEnd = plan[plan.length - 1]?.endsAt ?? writeStart;
  const focusAt = writeEnd + seconds(0.34);

  /** Characters of a row written by now, indentation included. */
  const writtenChars = (row: (typeof plan)[number]) =>
    row.indent +
    Math.round(
      interpolate(
        frame,
        [row.startsAt, Math.max(row.endsAt, row.startsAt + 1)],
        [0, row.cost],
        clamp,
      ),
    );

  // --- Window -------------------------------------------------------------
  const enter = spring({
    fps,
    frame,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });
  const chromeIn = interpolate(frame, [seconds(0.1), seconds(0.4)], [0, 1], {
    easing: EASING.enter,
    ...clamp,
  });
  const focusProgress = hasFocus
    ? interpolate(frame, [focusAt, focusAt + seconds(0.5)], [0, 1], {
        easing: EASING.enter,
        ...clamp,
      })
    : 0;

  // --- Caret --------------------------------------------------------------
  const charWidth = FONT_SIZE * MONO_ADVANCE;
  const writing = plan.findIndex((row) => frame < row.endsAt);
  const caretRow = writing === -1 ? plan.length - 1 : writing;
  const caretPlan = plan[caretRow];
  const caretChars = caretPlan ? writtenChars(caretPlan) : 0;
  // While writing the caret is solid; once the file is done it rests and blinks.
  const caretResting = frame >= writeEnd;

  // --- Scroll -------------------------------------------------------------
  // The viewport follows the write head fractionally, so a long listing pans
  // instead of jumping a whole line-height as each row starts.
  const visibleRows = Math.min(plan.length, MAX_VISIBLE_ROWS);
  const bodyHeight = visibleRows * ROW_HEIGHT + BODY_PADDING * 2;
  // Rows count in fractionally as they open, so a long listing pans by that
  // fraction instead of jumping a whole line-height when a row starts.
  const openRows = plan.reduce(
    (total, row) =>
      total +
      interpolate(frame, [row.startsAt, row.startsAt + 6], [0, 1], {
        easing: EASING.enter,
        ...clamp,
      }),
    0,
  );
  const scrollY = Math.max(0, openRows - visibleRows) * ROW_HEIGHT;
  const codeInset = showLineNumbers ? GUTTER_WIDTH + CODE_INSET : BODY_PADDING;

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
          opacity: chromeIn * (0.55 + focusProgress * 0.45),
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
          transform: `scale(${scale * interpolate(enter, [0, 1], [0.965, 1])}) translateY(${interpolate(enter, [0, 1], [26, 0])}px)`,
          opacity: enter,
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
            opacity: chromeIn,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: accentColor,
                // The unsaved-changes dot settles once the file is written.
                opacity: interpolate(
                  frame,
                  [writeEnd, writeEnd + seconds(0.4)],
                  [1, 0.2],
                  clamp,
                ),
              }}
            />
            <span
              style={{
                color: palette.dim,
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: 0.2,
              }}
            >
              {title}
            </span>
          </div>
          <span
            style={{
              marginLeft: "auto",
              color: palette.faint,
              fontSize: 13,
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
            {language}
          </span>
        </div>

        {/* Editor body */}
        <div
          style={{
            height: bodyHeight,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {showLineNumbers ? (
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: GUTTER_WIDTH,
                background: palette.gutter,
                borderRight: `1px solid ${palette.border}`,
              }}
            />
          ) : null}

          <div
            style={{
              position: "absolute",
              inset: 0,
              paddingTop: BODY_PADDING,
              paddingBottom: BODY_PADDING,
            }}
          >
            <div
              style={{
                transform: `translateY(${-scrollY}px)`,
                fontSize: FONT_SIZE,
                lineHeight: `${ROW_HEIGHT}px`,
                position: "relative",
              }}
            >
              {plan.map((row, index) => {
                const started = frame >= row.startsAt;
                const written = started ? writtenChars(row) : 0;
                const complete = written >= row.indent + row.cost;
                const isFocused = focused.has(index + startLine);
                // Unfocused lines recede rather than vanish — the reader should
                // still feel the shape of the file around the point.
                const recede = hasFocus && !isFocused ? focusProgress : 0;

                return (
                  <div
                    key={`${index}-${lines[index]}`}
                    style={{
                      height: ROW_HEIGHT,
                      display: "flex",
                      alignItems: "center",
                      position: "relative",
                      opacity: started
                        ? interpolate(recede, [0, 1], [1, 0.34])
                        : 0,
                    }}
                  >
                    {isFocused ? (
                      <>
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: `${accentColor}14`,
                            opacity: focusProgress,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 3,
                            bottom: 3,
                            width: 3,
                            borderRadius: 3,
                            background: accentColor,
                            opacity: focusProgress,
                            transform: `scaleY(${0.35 + focusProgress * 0.65})`,
                          }}
                        />
                      </>
                    ) : null}
                    {showLineNumbers ? (
                      <span
                        style={{
                          width: GUTTER_WIDTH,
                          flexShrink: 0,
                          paddingRight: 16,
                          textAlign: "right",
                          color: palette.faint,
                          fontVariantNumeric: "tabular-nums",
                          fontSize: FONT_SIZE * 0.82,
                          position: "relative",
                        }}
                      >
                        {index + startLine}
                        {isFocused ? (
                          // The number only takes the accent as focus lands —
                          // colouring it up front would give the point away.
                          <span
                            style={{
                              position: "absolute",
                              inset: 0,
                              paddingRight: 16,
                              color: accentColor,
                              opacity: focusProgress,
                            }}
                          >
                            {index + startLine}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                    <span
                      style={{
                        paddingLeft: showLineNumbers ? CODE_INSET : BODY_PADDING,
                        position: "relative",
                      }}
                    >
                      <CodeLine
                        tokens={row.tokens}
                        theme={palette}
                        reveal={complete ? undefined : written}
                      />
                    </span>
                  </div>
                );
              })}

              {/* Caret rides the write head, then rests at the end of the file */}
              {frame >= writeStart && caretPlan ? (
                <div
                  style={{
                    position: "absolute",
                    top: caretRow * ROW_HEIGHT,
                    left: codeInset + caretChars * charWidth,
                    height: ROW_HEIGHT,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Caret
                    color={accentColor}
                    width={charWidth * 0.9}
                    height={FONT_SIZE * 1.15}
                    radius={2}
                    blink={caretResting}
                    blinkPerSecond={1.6}
                    speed={speed}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {/* Fades so scrolled rows dissolve rather than clip */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: BODY_PADDING,
              background: `linear-gradient(${palette.window}, ${palette.window}00)`,
              opacity: Math.min(1, scrollY / 10),
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: BODY_PADDING,
              background: `linear-gradient(${palette.window}00, ${palette.window})`,
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
};
