import { useMemo } from "react";
import { interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING_ENTER } from "@/remotion/lib/timing";

export type CursorStyle = "bar" | "block" | "underscore";

export type TypewriterProps = {
  /** Text to reveal. `[pause:0.6]` anywhere in the string holds the caret. */
  text: string;
  /** Frames per character. Values below 1 type more than one character a frame. */
  charFrames?: number;
  /** Total typing length, used when `charFrames` is omitted. */
  durationInFrames?: number;
  delayInFrames?: number;
  /** Hold after this substring is typed. */
  pauseAfter?: string;
  /** Length of the `pauseAfter` hold, in seconds. */
  pauseSeconds?: number;
  showCursor?: boolean;
  cursorBlinkFrames?: number;
  cursorColor?: string;
  cursorWidth?: number;
  cursorStyle?: CursorStyle;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  fontFamily?: string;
  style?: React.CSSProperties;
  /** Uneven key rhythm — the difference between typing and a progress bar. */
  humanize?: boolean;
  /**
   * Varies the `humanize` rhythm. Two typewriters on one frame with the same
   * seed hit the same keys at the same moments, which is what gives away that
   * they are the same component.
   */
  seed?: string | number;
  /** Rest on sentence punctuation. */
  respectPunctuation?: boolean;
  punctuationPauseSeconds?: number;
  /** Type, hold, delete, repeat. */
  loop?: boolean;
  loopPauseSeconds?: number;
  backspaceCharFrames?: number;
  /**
   * Reserve the full block up front so the line never reflows as words land.
   * Turn it off only when the caret must sit against a shrink-wrapped box.
   */
  reserveSpace?: boolean;
};

type ExplicitPause = {
  afterIndex: number;
  frames: number;
};

type TypewriterTimeline = {
  displayText: string;
  /** Frame each character appears on. Fractional, so sub-frame speeds work. */
  appearFrames: number[];
  typeFrames: number;
  loopPauseFrames: number;
  backspaceFrames: number;
  cycleFrames: number;
};

const PAUSE_MARKER = /\[pause:(\d*\.?\d+)\]/g;
const PUNCTUATION = /[.!?;:,]/;
/** A caret that has not moved for this long is resting, and starts blinking. */
const IDLE_FRAMES = 4;

function parsePauses(
  rawText: string,
  fps: number,
): { displayText: string; pauses: ExplicitPause[] } {
  const pauses: ExplicitPause[] = [];
  let displayText = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  PAUSE_MARKER.lastIndex = 0;
  while ((match = PAUSE_MARKER.exec(rawText)) !== null) {
    displayText += rawText.slice(lastIndex, match.index);
    pauses.push({
      afterIndex: displayText.length - 1,
      frames: Math.max(1, Math.round(parseFloat(match[1]) * fps)),
    });
    lastIndex = match.index + match[0].length;
  }

  displayText += rawText.slice(lastIndex);
  return { displayText, pauses };
}

function buildTimeline(
  displayText: string,
  pauses: ExplicitPause[],
  {
    baseCharFrames,
    delayFrames,
    pauseAfter,
    pauseAfterFrames,
    humanize,
    seed,
    respectPunctuation,
    punctuationPauseFrames,
    loopPauseFrames,
    backspaceCharFrames,
  }: {
    baseCharFrames: number;
    delayFrames: number;
    pauseAfter?: string;
    pauseAfterFrames: number;
    humanize: boolean;
    seed: string | number;
    respectPunctuation: boolean;
    punctuationPauseFrames: number;
    loopPauseFrames: number;
    backspaceCharFrames: number;
  },
): TypewriterTimeline {
  let currentFrame = delayFrames;

  for (const pause of pauses) {
    if (pause.afterIndex < 0) {
      currentFrame += pause.frames;
    }
  }

  const appearFrames: number[] = [];
  const pauseAfterIndex = pauseAfter
    ? displayText.indexOf(pauseAfter) + pauseAfter.length - 1
    : -1;

  for (let i = 0; i < displayText.length; i++) {
    appearFrames.push(currentFrame);

    /* Deterministic jitter from Remotion's seeded generator (doc rule 2): same
     * string and seed, same rhythm, every render — and a different seed types
     * to a different rhythm, so two of these side by side do not sync. */
    const jitter = humanize ? 0.7 + random(`${seed}-${i}`) * 0.6 : 1;
    currentFrame += baseCharFrames * jitter;

    for (const pause of pauses) {
      if (pause.afterIndex === i) {
        currentFrame += pause.frames;
      }
    }

    if (respectPunctuation && PUNCTUATION.test(displayText[i])) {
      currentFrame += punctuationPauseFrames;
    }

    if (i === pauseAfterIndex) {
      currentFrame += pauseAfterFrames;
    }
  }

  const typeFrames = currentFrame;
  const backspaceFrames = displayText.length * backspaceCharFrames;

  return {
    displayText,
    appearFrames,
    typeFrames,
    loopPauseFrames,
    backspaceFrames,
    cycleFrames: typeFrames + loopPauseFrames + backspaceFrames,
  };
}

function countAppeared(appearFrames: number[], frame: number): number {
  let visible = 0;
  for (const appearFrame of appearFrames) {
    if (appearFrame > frame) break;
    visible++;
  }
  return visible;
}

function getVisibleChars(
  frame: number,
  timeline: TypewriterTimeline,
  loop: boolean,
): number {
  const total = timeline.displayText.length;
  if (total === 0) return 0;
  if (!loop) return countAppeared(timeline.appearFrames, frame);

  const cycleFrame = frame % Math.max(1, timeline.cycleFrames);

  if (cycleFrame < timeline.typeFrames) {
    return countAppeared(timeline.appearFrames, cycleFrame);
  }

  if (cycleFrame < timeline.typeFrames + timeline.loopPauseFrames) {
    return total;
  }

  const perChar = Math.max(1, timeline.backspaceFrames / total);
  const deleted = Math.floor(
    (cycleFrame - timeline.typeFrames - timeline.loopPauseFrames) / perChar,
  );
  return Math.max(0, total - Math.min(total, deleted));
}

const Cursor: React.FC<{
  frame: number;
  blinkFrames: number;
  blinking: boolean;
  color: string;
  cursorColor?: string;
  cursorWidth?: number;
  cursorStyle: CursorStyle;
  fontSize: number;
}> = ({
  frame,
  blinkFrames,
  blinking,
  color,
  cursorColor,
  cursorWidth,
  cursorStyle,
  fontSize,
}) => {
  const phase = (frame % Math.max(1, blinkFrames)) / Math.max(1, blinkFrames);
  const opacity = blinking
    ? interpolate(phase, [0, 0.4, 0.5, 1], [1, 0.12, 0.12, 1], {
        easing: EASING_ENTER,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  const resolvedColor = cursorColor ?? color;
  const resolvedWidth = cursorWidth ?? Math.max(2, Math.round(fontSize * 0.06));

  const baseStyle: React.CSSProperties = {
    display: "inline-block",
    opacity,
    marginLeft: cursorStyle === "block" ? "0.04em" : "0.08em",
    verticalAlign: "text-bottom",
    background: resolvedColor,
  };

  if (cursorStyle === "block") {
    return (
      <span
        style={{ ...baseStyle, width: "0.55em", height: "1.1em", borderRadius: 2 }}
      />
    );
  }

  if (cursorStyle === "underscore") {
    return (
      <span
        style={{
          ...baseStyle,
          width: "0.65em",
          height: resolvedWidth,
          borderRadius: 1,
          verticalAlign: "baseline",
        }}
      />
    );
  }

  return (
    <span
      style={{ ...baseStyle, width: resolvedWidth, height: "1.1em", borderRadius: 1 }}
    />
  );
};

/**
 * Types a string out under a live caret.
 *
 * Two details carry the illusion. The caret holds solid while keys are landing
 * and only blinks once it rests — a caret that blinks mid-word looks like a
 * loading state, not typing. And the full block is measured up front, so a
 * wrapping line does not shunt everything under it down a row mid-sentence.
 */
export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  charFrames,
  durationInFrames = 60,
  delayInFrames = 0,
  pauseAfter,
  pauseSeconds = 0.6,
  showCursor = true,
  cursorBlinkFrames = 30,
  cursorColor,
  cursorWidth,
  cursorStyle = "bar",
  fontSize: fontSizeProp,
  fontWeight = 600,
  color = "#ececec",
  fontFamily,
  style,
  humanize = false,
  seed = "typewriter",
  respectPunctuation = false,
  punctuationPauseSeconds = 0.25,
  loop = false,
  loopPauseSeconds = 1,
  backspaceCharFrames = 1,
  reserveSpace = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(84, width);

  const timeline = useMemo(() => {
    const { displayText, pauses } = parsePauses(text, fps);
    const baseCharFrames =
      charFrames ?? durationInFrames / Math.max(1, displayText.length);

    return buildTimeline(displayText, pauses, {
      baseCharFrames: Math.max(0.05, baseCharFrames),
      delayFrames: delayInFrames,
      pauseAfter,
      pauseAfterFrames: pauseAfter ? Math.round(fps * pauseSeconds) : 0,
      humanize,
      seed,
      respectPunctuation,
      punctuationPauseFrames: Math.round(fps * punctuationPauseSeconds),
      loopPauseFrames: loop ? Math.round(fps * loopPauseSeconds) : 0,
      backspaceCharFrames: Math.max(0.05, backspaceCharFrames),
    });
  }, [
    text,
    fps,
    charFrames,
    durationInFrames,
    delayInFrames,
    pauseAfter,
    pauseSeconds,
    humanize,
    seed,
    respectPunctuation,
    punctuationPauseSeconds,
    loop,
    loopPauseSeconds,
    backspaceCharFrames,
  ]);

  const visibleChars = getVisibleChars(frame, timeline, loop);
  const typedText = timeline.displayText.slice(0, visibleChars);

  const lastAppear =
    visibleChars > 0 ? timeline.appearFrames[visibleChars - 1] : -Infinity;
  const cycleFrame = loop ? frame % Math.max(1, timeline.cycleFrames) : frame;
  const deleting =
    loop && cycleFrame >= timeline.typeFrames + timeline.loopPauseFrames;
  const blinking =
    !deleting && (visibleChars === 0 || cycleFrame - lastAppear > IDLE_FRAMES);

  const textStyle: React.CSSProperties = {
    fontSize,
    fontWeight,
    lineHeight: 1.2,
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
    ...(color !== undefined ? { color } : {}),
    ...(fontFamily !== undefined ? { fontFamily } : {}),
    ...style,
  };

  const typed = (
    <>
      {typedText}
      {showCursor ? (
        <Cursor
          frame={frame}
          blinkFrames={cursorBlinkFrames}
          blinking={blinking}
          color={color}
          cursorColor={cursorColor}
          cursorWidth={cursorWidth}
          cursorStyle={cursorStyle}
          fontSize={fontSize}
        />
      ) : null}
    </>
  );

  if (!reserveSpace) {
    return <span style={textStyle}>{typed}</span>;
  }

  return (
    <span style={{ ...textStyle, display: "inline-grid" }}>
      <span style={{ gridArea: "1 / 1", visibility: "hidden" }} aria-hidden>
        {timeline.displayText}
      </span>
      <span style={{ gridArea: "1 / 1" }}>{typed}</span>
    </span>
  );
};
