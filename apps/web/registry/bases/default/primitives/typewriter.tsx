import { useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING_ENTER } from "@/remotion/lib/timing";

export type CursorStyle = "bar" | "block" | "underscore";

export type TypewriterProps = {
  text: string;
  charFrames?: number;
  durationInFrames?: number;
  delayInFrames?: number;
  pauseAfter?: string;
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
  background?: boolean;
  humanize?: boolean;
  respectPunctuation?: boolean;
  punctuationPauseSeconds?: number;
  loop?: boolean;
  loopPauseSeconds?: number;
  backspaceCharFrames?: number;
};

type ExplicitPause = {
  afterIndex: number;
  frames: number;
};

type TypewriterTimeline = {
  displayText: string;
  appearFrames: number[];
  typeFrames: number;
  loopPauseFrames: number;
  backspaceFrames: number;
  cycleFrames: number;
};

const PAUSE_MARKER = /\[pause:(\d*\.?\d+)\]/g;
const PUNCTUATION = /[.!?;:,]/;

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
    const seconds = parseFloat(match[1]);
    pauses.push({
      afterIndex: displayText.length - 1,
      frames: Math.max(1, Math.round(seconds * fps)),
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

    let charFrames = baseCharFrames;
    if (humanize) {
      const jitter = (Math.sin(i * 7.3 + 1) + 1) / 2;
      charFrames = Math.max(1, Math.round(charFrames * (0.7 + jitter * 0.6)));
    }

    currentFrame += charFrames;

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
  const cycleFrames = typeFrames + loopPauseFrames + backspaceFrames;

  return {
    displayText,
    appearFrames,
    typeFrames,
    loopPauseFrames,
    backspaceFrames,
    cycleFrames,
  };
}

function getVisibleChars(
  frame: number,
  timeline: TypewriterTimeline,
  loop: boolean,
): number {
  if (timeline.displayText.length === 0) {
    return 0;
  }

  if (!loop) {
    let visible = 0;
    for (const appearFrame of timeline.appearFrames) {
      if (appearFrame <= frame) {
        visible++;
      } else {
        break;
      }
    }
    return visible;
  }

  const cycleFrame = frame % Math.max(1, timeline.cycleFrames);

  if (cycleFrame < timeline.typeFrames) {
    let visible = 0;
    for (const appearFrame of timeline.appearFrames) {
      if (appearFrame <= cycleFrame) {
        visible++;
      } else {
        break;
      }
    }
    return visible;
  }

  if (cycleFrame < timeline.typeFrames + timeline.loopPauseFrames) {
    return timeline.displayText.length;
  }

  const backspaceFrame =
    cycleFrame - timeline.typeFrames - timeline.loopPauseFrames;
  const charBackspaceFrames = Math.max(
    1,
    timeline.backspaceFrames / timeline.displayText.length,
  );
  const deleted = Math.min(
    timeline.displayText.length,
    Math.floor(backspaceFrame / charBackspaceFrames),
  );
  return Math.max(0, timeline.displayText.length - deleted);
}

const Cursor: React.FC<{
  frame: number;
  blinkFrames: number;
  color: string;
  cursorColor?: string;
  cursorWidth?: number;
  cursorStyle: CursorStyle;
  fontSize: number;
}> = ({ frame, blinkFrames, color, cursorColor, cursorWidth, cursorStyle, fontSize }) => {
  const phase = (frame % Math.max(1, blinkFrames)) / Math.max(1, blinkFrames);
  const opacity = interpolate(phase, [0, 0.4, 0.5, 1], [1, 0.12, 0.12, 1], {
    easing: EASING_ENTER,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
        style={{
          ...baseStyle,
          width: "0.55em",
          height: "1.1em",
          borderRadius: 2,
        }}
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
      style={{
        ...baseStyle,
        width: resolvedWidth,
        height: "1.1em",
        borderRadius: 1,
      }}
    />
  );
};

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
  background = false,
  humanize = false,
  respectPunctuation = false,
  punctuationPauseSeconds = 0.25,
  loop = false,
  loopPauseSeconds = 1,
  backspaceCharFrames = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(84, width);

  const timeline = useMemo(() => {
    const { displayText, pauses } = parsePauses(text, fps);
    const baseCharFrames =
      charFrames ?? Math.max(1, Math.floor(durationInFrames / Math.max(1, displayText.length)));

    return buildTimeline(displayText, pauses, {
      baseCharFrames,
      delayFrames: delayInFrames,
      pauseAfter,
      pauseAfterFrames: pauseAfter ? Math.round(fps * pauseSeconds) : 0,
      humanize,
      respectPunctuation,
      punctuationPauseFrames: Math.round(fps * punctuationPauseSeconds),
      loopPauseFrames: loop ? Math.round(fps * loopPauseSeconds) : 0,
      backspaceCharFrames: Math.max(1, backspaceCharFrames),
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
    respectPunctuation,
    punctuationPauseSeconds,
    loop,
    loopPauseSeconds,
    backspaceCharFrames,
  ]);

  const visibleChars = getVisibleChars(frame, timeline, loop);
  const typedText = timeline.displayText.slice(0, visibleChars);

  const content = (
    <span
      style={{
        fontSize,
        fontWeight,
        lineHeight: 1.2,
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
        ...(color !== undefined ? { color } : {}),
        ...(fontFamily !== undefined ? { fontFamily } : {}),
        ...style,
      }}
    >
      {typedText}
      {showCursor ? (
        <Cursor
          frame={frame}
          blinkFrames={cursorBlinkFrames}
          color={color}
          cursorColor={cursorColor}
          cursorWidth={cursorWidth}
          cursorStyle={cursorStyle}
          fontSize={fontSize}
        />
      ) : null}
    </span>
  );

  if (background) {
    return (
      <div
        style={{
          display: "inline-block",
          padding: "0.25em 0.55em",
          borderRadius: "0.35em",
          background: "rgba(255, 255, 255, 0.06)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};
