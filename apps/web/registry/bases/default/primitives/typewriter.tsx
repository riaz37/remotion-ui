import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export type TypewriterProps = {
  text: string;
  /** Frames per character — preferred over durationInFrames */
  charFrames?: number;
  /** Legacy: total duration; used when charFrames is omitted */
  durationInFrames?: number;
  delayInFrames?: number;
  /** Pause after this substring before continuing (skill pattern) */
  pauseAfter?: string;
  pauseSeconds?: number;
  showCursor?: boolean;
  cursorBlinkFrames?: number;
  className?: string;
  style?: React.CSSProperties;
};

function getTypedText({
  frame,
  fullText,
  pauseAfter,
  charFrames,
  pauseFrames,
}: {
  frame: number;
  fullText: string;
  pauseAfter?: string;
  charFrames: number;
  pauseFrames: number;
}): string {
  const pauseIndex =
    pauseAfter && pauseAfter.length > 0
      ? fullText.indexOf(pauseAfter)
      : -1;
  const preLen =
    pauseIndex >= 0 ? pauseIndex + pauseAfter!.length : fullText.length;

  let typedChars = 0;
  if (frame < preLen * charFrames) {
    typedChars = Math.floor(frame / charFrames);
  } else if (frame < preLen * charFrames + pauseFrames) {
    typedChars = preLen;
  } else {
    const postPhase = frame - preLen * charFrames - pauseFrames;
    typedChars = Math.min(
      fullText.length,
      preLen + Math.floor(postPhase / charFrames),
    );
  }

  return fullText.slice(0, typedChars);
}

const Cursor: React.FC<{
  frame: number;
  blinkFrames: number;
}> = ({ frame, blinkFrames }) => {
  const opacity = interpolate(
    frame % blinkFrames,
    [0, blinkFrames / 2, blinkFrames],
    [1, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return <span style={{ opacity }}>{"\u258C"}</span>;
};

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  charFrames,
  durationInFrames = 60,
  delayInFrames = 0,
  pauseAfter,
  pauseSeconds = 0.6,
  showCursor = true,
  cursorBlinkFrames = 16,
  className,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delayInFrames);
  const resolvedCharFrames =
    charFrames ?? Math.max(1, Math.floor(durationInFrames / text.length));
  const pauseFrames = pauseAfter ? Math.round(fps * pauseSeconds) : 0;

  const typedText = getTypedText({
    frame: localFrame,
    fullText: text,
    pauseAfter,
    charFrames: resolvedCharFrames,
    pauseFrames,
  });

  return (
    <span
      className={className}
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 48,
        fontWeight: 600,
        color: "white",
        ...style,
      }}
    >
      {typedText}
      {showCursor ? (
        <Cursor frame={localFrame} blinkFrames={cursorBlinkFrames} />
      ) : null}
    </span>
  );
};
