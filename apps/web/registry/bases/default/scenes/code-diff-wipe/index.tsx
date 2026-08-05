import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { stageScale } from "@/remotion/lib/ai-composer-utils";
import { CODE_THEMES, CodeLine, tokenizeCode } from "@/remotion/lib/code-syntax";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

/** Reference stage the window is laid out against, then uniformly scaled. */
const REF_WIDTH = 1280;
const REF_HEIGHT = 720;

const WINDOW_WIDTH = 940;
const HEADER_HEIGHT = 46;
const BODY_PADDING = 22;
const ROW_HEIGHT = 34;
const FONT_SIZE = 20;
const GUTTER_WIDTH = 46;
const CODE_INSET = 18;

export type CodeDiffWipeProps = {
  /** Source before the patch. */
  before?: string;
  /** Source after the patch. */
  after?: string;
  /** Filename on the window header. */
  title?: string;
  /** Seconds the patch front takes to travel the file. */
  wipeSeconds?: number;
  accentColor?: string;
  /** Overrides the page background behind the window. */
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_BEFORE = `export function render(scene) {
  const frames = scene.frames;
  return frames.map(draw);
}`;

const DEFAULT_AFTER = `export function render(scene, options) {
  const frames = scene.frames;
  const scale = options.scale ?? 1;
  return frames.map((frame) => draw(frame, scale));
}`;

type DiffKind = "context" | "remove" | "add";

type DiffRow = {
  kind: DiffKind;
  text: string;
};

/**
 * Line-level LCS diff. Snippets in a video are a handful of lines, so the
 * quadratic table is free and the result is the one a reader expects.
 */
function diffLines(before: string[], after: string[]): DiffRow[] {
  const table: number[][] = Array.from({ length: before.length + 1 }, () =>
    new Array(after.length + 1).fill(0),
  );

  for (let i = before.length - 1; i >= 0; i -= 1) {
    for (let j = after.length - 1; j >= 0; j -= 1) {
      table[i][j] =
        before[i] === after[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;

  while (i < before.length && j < after.length) {
    if (before[i] === after[j]) {
      rows.push({ kind: "context", text: before[i] });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      rows.push({ kind: "remove", text: before[i] });
      i += 1;
    } else {
      rows.push({ kind: "add", text: after[j] });
      j += 1;
    }
  }

  while (i < before.length) {
    rows.push({ kind: "remove", text: before[i] });
    i += 1;
  }
  while (j < after.length) {
    rows.push({ kind: "add", text: after[j] });
    j += 1;
  }

  return rows;
}

const CHROME_LIGHTS = ["#FF5F57", "#FEBC2E", "#28C840"] as const;

/** Drawn markers — a bare "+"/"−" in the gutter is a font gamble at this size. */
const Plus: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 5.5v13M5.5 12h13"
      stroke={color}
      strokeWidth={2.6}
      strokeLinecap="round"
    />
  </svg>
);

const Minus: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M5.5 12h13"
      stroke={color}
      strokeWidth={2.6}
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Diff wipe staged as the patch actually landing: the before-file sits whole,
 * then an apply front travels down it — removed lines redden and collapse as it
 * passes, added lines open under it and write themselves in — and the header
 * tallies the change as it goes.
 */
export const CodeDiffWipe: React.FC<CodeDiffWipeProps> = ({
  before = DEFAULT_BEFORE,
  after = DEFAULT_AFTER,
  title = "render.ts",
  wipeSeconds = 1.7,
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

  const rows = diffLines(
    before.replace(/\s+$/, "").replace(/^\n+/, "").split("\n"),
    after.replace(/\s+$/, "").replace(/^\n+/, "").split("\n"),
  );
  const tokenRows = tokenizeCode(rows.map((row) => row.text));

  const added = rows.filter((row) => row.kind === "add").length;
  const removed = rows.filter((row) => row.kind === "remove").length;

  const addColor = palette.token.string;
  const removeColor = theme === "dark" ? "#F87171" : "#DC2626";

  // --- Timeline -----------------------------------------------------------
  const wipeStart = seconds(0.7);
  const wipeFrames = seconds(wipeSeconds);
  const rowTrigger = (index: number) =>
    wipeStart + (rows.length <= 1 ? 0 : (index / rows.length) * wipeFrames);
  const wipeEnd = wipeStart + wipeFrames;

  /** 0 → 1 as the apply front passes a given row. */
  const rowProgress = (index: number) =>
    interpolate(
      frame,
      [rowTrigger(index), rowTrigger(index) + seconds(0.3)],
      [0, 1],
      { easing: EASING.enter, ...clamp },
    );

  const enter = spring({
    fps,
    frame,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });
  const chromeIn = interpolate(frame, [seconds(0.1), seconds(0.4)], [0, 1], {
    easing: EASING.enter,
    ...clamp,
  });
  // Tints hold while the change is fresh, then cool off.
  const settle = interpolate(
    frame,
    [wipeEnd + seconds(0.7), wipeEnd + seconds(1.4)],
    [0, 1],
    { easing: EASING.enter, ...clamp },
  );

  // Removed lines hold their place, struck through, while the front passes —
  // both sides of the change are readable together, the way a diff is meant to
  // be read. Only once the patch has fully landed do they drop away, leaving
  // the new file behind.
  const dropOld = interpolate(
    frame,
    [wipeEnd + seconds(0.3), wipeEnd + seconds(0.75)],
    [0, 1],
    { easing: EASING.enter, ...clamp },
  );

  const heights = rows.map((row, index) => {
    const progress = rowProgress(index);
    if (row.kind === "remove") return ROW_HEIGHT * (1 - dropOld);
    if (row.kind === "add") return ROW_HEIGHT * progress;
    return ROW_HEIGHT;
  });

  // The front is drawn where the rows it has already passed end, so it always
  // sits on the seam between changed and untouched code.
  const frontIndex = interpolate(frame, [wipeStart, wipeEnd], [0, rows.length], {
    ...clamp,
  });
  const frontY = heights
    .slice(0, Math.floor(frontIndex))
    .reduce((total, value) => total + value, 0);
  const frontVisible = interpolate(
    frame,
    [wipeStart - seconds(0.15), wipeStart, wipeEnd, wipeEnd + seconds(0.3)],
    [0, 1, 1, 0],
    clamp,
  );

  // The window breathes with its contents rather than reserving dead space for
  // the widest moment of the diff.
  const bodyHeight =
    heights.reduce((total, value) => total + value, 0) + BODY_PADDING * 2;
  const glyphSize = FONT_SIZE * 0.8;

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
          opacity: chromeIn,
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
        }}
      >
        {/* Header chrome, with the tally filling in as the patch lands */}
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
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              textAlign: "center",
              color: palette.dim,
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: 0.2,
              pointerEvents: "none",
            }}
          >
            {title}
          </span>
          <span
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 12,
              fontSize: 14,
              fontVariantNumeric: "tabular-nums",
              // There is nothing to tally until the patch starts landing.
              opacity: interpolate(
                frame,
                [wipeStart - seconds(0.2), wipeStart + seconds(0.2)],
                [0, 1],
                clamp,
              ),
            }}
          >
            <span style={{ color: addColor }}>
              +
              {Math.round(
                interpolate(frame, [wipeStart, wipeEnd], [0, added], clamp),
              )}
            </span>
            <span style={{ color: removeColor }}>
              −
              {Math.round(
                interpolate(frame, [wipeStart, wipeEnd], [0, removed], clamp),
              )}
            </span>
          </span>
        </div>

        {/* Diff body */}
        <div
          style={{
            height: bodyHeight,
            paddingTop: BODY_PADDING,
            paddingBottom: BODY_PADDING,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative" }}>
            {rows.map((row, index) => {
              const progress = rowProgress(index);
              const isAdd = row.kind === "add";
              const isRemove = row.kind === "remove";
              const tint = isRemove ? progress : (1 - settle) * progress;
              const color = isAdd
                ? addColor
                : isRemove
                  ? removeColor
                  : palette.faint;
              const revealed = isAdd
                ? Math.round(progress * row.text.length)
                : row.text.length;

              return (
                <div
                  key={`${index}-${row.text}`}
                  style={{
                    height: heights[index],
                    overflow: "hidden",
                    display: "flex",
                    // Rows close like a shutter from the bottom — centring the
                    // content would clip the type from both sides at once.
                    alignItems: "flex-start",
                    fontSize: FONT_SIZE,
                    lineHeight: `${ROW_HEIGHT}px`,
                    background:
                      isAdd || isRemove ? `${color}${tintAlpha(tint)}` : "none",
                    // A removed line drains toward the gutter as it closes.
                    opacity: isRemove ? 1 - progress * 0.3 - dropOld * 0.5 : 1,
                  }}
                >
                  <span
                    style={{
                      width: GUTTER_WIDTH,
                      height: ROW_HEIGHT,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isAdd ? (
                      <Plus size={glyphSize} color={addColor} />
                    ) : isRemove ? (
                      <Minus size={glyphSize} color={removeColor} />
                    ) : null}
                  </span>
                  <span
                    style={{
                      paddingLeft: CODE_INSET,
                      height: ROW_HEIGHT,
                      display: "flex",
                      alignItems: "center",
                      // Struck-through text stays legible while it leaves.
                      // Longhand only — mixing the `textDecoration` shorthand
                      // with `textDecorationColor` warns on rerender.
                      textDecorationLine:
                        isRemove && progress > 0.15 ? "line-through" : "none",
                      textDecorationColor: removeColor,
                    }}
                  >
                    <CodeLine
                      tokens={tokenRows[index]}
                      theme={palette}
                      reveal={revealed >= row.text.length ? undefined : revealed}
                      muted={row.kind === "context"}
                    />
                  </span>
                </div>
              );
            })}

            {/* The apply front */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: frontY,
                height: 2,
                background: accentColor,
                opacity: frontVisible * 0.9,
                boxShadow: `0 0 18px 2px ${accentColor}66`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/** 0 → 1 tint as a two-digit hex alpha suffix for an 8-digit colour. */
function tintAlpha(value: number): string {
  const alpha = Math.round(Math.max(0, Math.min(1, value)) * 30);
  return alpha.toString(16).padStart(2, "0");
}
