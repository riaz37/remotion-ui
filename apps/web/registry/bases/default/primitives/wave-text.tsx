import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  SplitTextChars,
  type SplitTextCharsProps,
} from "@/remotion/primitives/split-text-chars";
import type { SplitUnitState } from "@/remotion/lib/text-split";

export type WaveTextProps = Omit<
  SplitTextCharsProps,
  "effect" | "renderUnit"
> & {
  /** Peak displacement, in em of the font size. */
  amplitude?: number;
  /** Units per full wave. Higher spreads the crest over more characters. */
  wavelength?: number;
  /** Frames for one full cycle. */
  periodInFrames?: number;
  /** Travel direction along the line. */
  direction?: "forward" | "backward";
  /** Scale the crest as well as lift it, so it reads as depth rather than jitter. */
  scale?: number;
  /** Fade the trough. 0 keeps every unit at full opacity. */
  shade?: number;
};

/**
 * Runs a sine along a line of type, one character at a time.
 *
 * The wave is a function of the frame, not of the entrance, so it never
 * settles — this is an ambient loop, not an entrance. The entrance is still
 * there underneath (`split-text-chars` owns it), and the amplitude is scaled by
 * each unit's own arrival progress so a character does not start bobbing before
 * it has landed.
 *
 * Phase is keyed off `unit.index` — document order — not off the stagger rank,
 * because a wave that travels in the stagger order of `order="random"` is not a
 * wave.
 */
export const WaveText: React.FC<WaveTextProps> = ({
  amplitude = 0.16,
  wavelength = 6,
  periodInFrames = 48,
  direction = "forward",
  scale = 0.06,
  shade = 0.25,
  ...splitProps
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // fps only normalises the period so the same props read the same at 60fps.
  const period = Math.max(1, periodInFrames * (fps / 30));
  const sign = direction === "forward" ? -1 : 1;

  const renderUnit = (unit: SplitUnitState) => {
    const phase =
      (frame / period) * Math.PI * 2 +
      (sign * unit.index * Math.PI * 2) / Math.max(1, wavelength);
    const wave = Math.sin(phase);
    // The entrance gates the wave: `value` is 0 until the unit has arrived and
    // returns to 0 through the exit, so the line lifts and lowers as one.
    const gate = Math.max(0, Math.min(1, unit.value));

    return (
      <span
        style={{
          display: "inline-block",
          whiteSpace: "pre",
          translate: `0 ${(wave * amplitude * gate).toFixed(4)}em`,
          scale: `${(1 + wave * scale * gate).toFixed(4)}`,
          opacity: 1 - ((1 - wave) / 2) * shade,
          willChange: "transform",
        }}
      >
        {unit.text}
      </span>
    );
  };

  return <SplitTextChars {...splitProps} effect="fade" renderUnit={renderUnit} />;
};
