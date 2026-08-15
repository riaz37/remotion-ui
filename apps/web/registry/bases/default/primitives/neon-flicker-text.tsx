import { useCurrentFrame } from "remotion";
import {
  SplitTextChars,
  type SplitTextCharsProps,
} from "@/remotion/primitives/split-text-chars";
import type { SplitUnitState } from "@/remotion/lib/text-split";

export type NeonFlickerTextProps = Omit<
  SplitTextCharsProps,
  "effect" | "renderUnit"
> & {
  /** Colour of the halo around the tube. */
  glowColor?: string;
  /** Halo radius in px at full brightness. */
  glowSize?: number;
  /** The tube with no gas lit — cold glass, not invisible. */
  offColor?: string;
  /** Brightness of an unlit tube, 0–1. */
  offLevel?: number;
  /** Depth of the mains hum once the sign has settled, 0–1. */
  hum?: number;
  /** Chance per beat that a settled tube stutters. 0 disables it. */
  buzz?: number;
  /** Flicker off again on the way out. */
  flickerOnExit?: boolean;
};

/** Deterministic 0–1. A real random would resample per render pass. */
function noise(index: number, beat: number, seed: number): number {
  const value = Math.sin(index * 73.19 + beat * 137.51 + seed * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Lights a word tube by tube, the way a neon sign actually starts.
 *
 * The flicker is a gas-discharge model, not a random opacity: an unlit tube is
 * still there as cold glass (`offColor`), the strike probability climbs across
 * each character's own window so the sign resolves rather than sputtering
 * forever, and once lit the tube keeps a mains hum and an occasional stutter.
 * A settled state with no hum is what makes a neon effect look like a static
 * PNG two seconds in.
 */
export const NeonFlickerText: React.FC<NeonFlickerTextProps> = ({
  glowColor = "#f472b6",
  glowSize = 26,
  offColor = "rgba(244,114,182,0.16)",
  offLevel = 0.14,
  hum = 0.12,
  buzz = 0.06,
  flickerOnExit = true,
  color = "#fdf2f8",
  seed = 1,
  ...splitProps
}) => {
  const frame = useCurrentFrame();

  const renderUnit = (unit: SplitUnitState) => {
    const striking = unit.enter > 0 && unit.enter < 1;
    const leaving = flickerOnExit && unit.exit > 0;

    let lit: number;
    if (unit.enter <= 0) {
      lit = 0;
    } else if (striking) {
      // Strike probability climbs with the unit's own progress, so the tube
      // stutters at first and is solid by the end of its window.
      const beat = Math.floor(frame / 2);
      lit = noise(unit.index, beat, seed) < 0.22 + 0.78 * unit.enter ? 1 : offLevel;
    } else {
      const wave = 0.5 + 0.5 * Math.sin(frame * 0.42 + unit.index * 1.3);
      const stutter =
        buzz > 0 && noise(unit.index, Math.floor(frame / 3), seed + 7) < buzz;
      lit = stutter ? offLevel + 0.2 : 1 - hum * wave;
    }

    if (leaving) {
      // Going out is not the entrance reversed: the gas dies in stutters, and
      // the odds of a dead beat rise as the exit runs.
      const dying = noise(unit.index, Math.floor(frame / 2), seed + 3);
      if (dying < unit.exit) lit = offLevel;
    }

    const on = lit > offLevel + 0.001;
    const glow = Math.max(0, lit);

    return (
      <span
        style={{
          display: "inline-block",
          whiteSpace: "pre",
          opacity: unit.enter > 0 ? 1 - unit.exit : 0,
          color: on ? color : offColor,
          textShadow: on
            ? `0 0 ${(glowSize * 0.16 * glow).toFixed(1)}px ${glowColor}, 0 0 ${(glowSize * 0.5 * glow).toFixed(1)}px ${glowColor}, 0 0 ${(glowSize * glow).toFixed(1)}px ${glowColor}, 0 0 ${(glowSize * 2.2 * glow).toFixed(1)}px ${glowColor}`
            : "none",
        }}
      >
        {unit.text}
      </span>
    );
  };

  return (
    <SplitTextChars
      {...splitProps}
      color={color}
      seed={seed}
      effect="none"
      renderUnit={renderUnit}
    />
  );
};
