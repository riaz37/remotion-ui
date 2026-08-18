import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";

export type MatrixDecodeProps = {
  text: string;
  durationInFrames?: number;
  delayInFrames?: number;
  fontSize?: number;
  color?: string;
  /** Colour of the single character sitting on the decode front. */
  hotColor?: string;
  /**
   * Pool the unresolved characters are drawn from.
   *
   * Must be **monospace-width in `fontFamily`**, or the line changes width as
   * it resolves. The classic full-width katakana are twice the advance of a
   * latin glyph in every monospace face, so a 25-character line rendered in
   * them is twice as wide as the text it decodes into and runs off the frame
   * while it is still scrambled.
   */
  glyphs?: string;
  fontWeight?: number;
  fontFamily?: string;
};

const GLYPHS = "0123456789ABCDEFGHJKLMNPQRSTUVXYZ#$%&*+=<>/\\";

/** How many characters either side of the front a glyph may lock in early/late. */
const RESOLVE_JITTER = 2;
/** Frames between scramble glyph swaps — lower churns faster. */
const SCRAMBLE_CHURN = 40;
/** Deterministic hash constants for the per-character jitter. */
const JITTER_SEED_A = 12.9898;
const JITTER_SEED_B = 43758.5453;

/**
 * Deterministic pseudo-random offset in [-RESOLVE_JITTER, RESOLVE_JITTER].
 * No `Math.random` — the same index always yields the same offset so renders
 * are reproducible frame to frame and machine to machine.
 */
function resolveJitter(index: number): number {
  const hash = Math.sin((index + 1) * JITTER_SEED_A) * JITTER_SEED_B;
  const unit = hash - Math.floor(hash);
  return Math.round((unit * 2 - 1) * RESOLVE_JITTER);
}

function scrambleGlyph(index: number, progress: number, pool: string): string {
  const seed =
    (index * 17 + Math.floor(progress * SCRAMBLE_CHURN)) % pool.length;
  return pool[seed] ?? pool[0]!;
}

export const MatrixDecode: React.FC<MatrixDecodeProps> = ({
  text,
  durationInFrames = 50,
  delayInFrames = 0,
  fontSize: fontSizeProp,
  color = "#2dd4bf",
  hotColor = "#5eead4",
  glyphs = GLYPHS,
  fontWeight = 600,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(72, width);
  const progress = interpolate(
    frame,
    [delayInFrames, delayInFrames + durationInFrames],
    [0, 1],
    // Linear on purpose: the decode front is a sweep at a constant rate, and
    // easing it makes the resolve visibly stall at one end of the string.
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const chars = Array.from(text);
  // The resolve front sweeps the whole string left to right. It is padded by
  // the jitter range on both ends so the first and last characters still get a
  // scrambled beat and a settled beat respectively.
  const front =
    progress * (chars.length + RESOLVE_JITTER * 2) - RESOLVE_JITTER;

  const resolved = chars.map((char, index) => {
    if (char === " ") return true;
    if (progress >= 1) return true;
    return index + resolveJitter(index) < front;
  });
  const hotIndex = resolved.findIndex((isResolved) => !isResolved);

  return (
    <span
      style={{
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.2,
        whiteSpace: "pre",
        fontFamily: fontFamily ?? "ui-monospace, monospace",
      }}
    >
      {chars.map((char, index) => {
        const isResolved = resolved[index];
        return (
          <span
            key={`${char}-${index}`}
            style={index === hotIndex ? { color: hotColor } : undefined}
          >
            {isResolved ? char : scrambleGlyph(index, progress, glyphs)}
          </span>
        );
      })}
    </span>
  );
};
