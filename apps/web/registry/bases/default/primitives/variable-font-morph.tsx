import { useCurrentFrame } from "remotion";
import {
  SplitTextChars,
  type SplitTextCharsProps,
} from "@/remotion/primitives/split-text-chars";
import type { SplitUnitState } from "@/remotion/lib/text-split";

/** `[from, to]` for one registered or custom OpenType axis. */
export type FontAxisRange = [number, number];

export type VariableFontMorphProps = Omit<
  SplitTextCharsProps,
  "effect" | "renderUnit" | "fontWeight"
> & {
  /** `wght` axis. Also mirrored onto `font-weight` for non-variable faces. */
  weight?: FontAxisRange;
  /** `wdth` axis, in percent. Also mirrored onto `font-stretch`. */
  width?: FontAxisRange;
  /** `slnt` axis, in degrees. Negative leans right, per the spec. */
  slant?: FontAxisRange;
  /** Any further axes by four-letter tag, e.g. `{ opsz: [14, 96] }`. */
  axes?: Record<string, FontAxisRange>;
  /** Keep travelling between the two ends instead of landing on `to`. */
  oscillate?: boolean;
  /** Frames for one there-and-back when oscillating. */
  periodInFrames?: number;
  /** Characters offset per unit along the wave, in radians. */
  phaseStep?: number;
  /**
   * Reserve each glyph's widest advance so the line cannot breathe.
   *
   * `wght` and `wdth` both change advance widths, so a centred line re-centres
   * itself every frame and the whole string jitters horizontally. Each unit is
   * laid out in an `inline-grid` cell sized by a hidden copy at the heaviest,
   * widest setting; the animated glyph is centred inside that fixed cell.
   */
  reserveSpace?: boolean;
};

const lerp = (range: FontAxisRange, t: number) =>
  range[0] + (range[1] - range[0]) * t;

/**
 * Sweeps a variable font's axes across a line, one character at a time.
 *
 * The axis position is a single 0–1 value per unit, spent on every requested
 * axis at once — a real variable face moves `wght` and `wdth` together, and
 * driving them from separate clocks makes the type look broken rather than
 * variable.
 *
 * **Fallback.** `font-variation-settings` does nothing on a static face, so the
 * `wght` and `wdth` values are also written to `font-weight` and
 * `font-stretch`. A family shipping discrete weights therefore steps between
 * them instead of gliding, which is visibly coarser but never frozen. Pass a
 * variable `fontFamily` to get the real thing.
 */
export const VariableFontMorph: React.FC<VariableFontMorphProps> = ({
  weight = [200, 800],
  width,
  slant,
  axes,
  oscillate = false,
  periodInFrames = 60,
  phaseStep = 0.55,
  reserveSpace = true,
  ...splitProps
}) => {
  const frame = useCurrentFrame();
  const period = Math.max(1, periodInFrames);

  // The widest the type can ever be. Sized from the axis maxima rather than
  // from `position = 1`, so a descending range like `[900, 200]` still
  // reserves the heavy end.
  const heaviest = Math.max(weight[0], weight[1]);
  const widest = width ? Math.max(width[0], width[1]) : undefined;
  const reserveSettings = [`"wght" ${heaviest.toFixed(1)}`];
  if (widest !== undefined) reserveSettings.push(`"wdth" ${widest.toFixed(1)}`);

  const renderUnit = (unit: SplitUnitState) => {
    // One position drives every axis. `enter` ramps it in, the oscillation
    // takes over once the unit has arrived, and the exit relaxes it back.
    const wave = oscillate
      ? 0.5 +
        0.5 *
          Math.sin((frame / period) * Math.PI * 2 - unit.index * phaseStep)
      : 1;
    const position =
      Math.max(0, Math.min(1, unit.enter)) * wave * (1 - unit.exit);

    const settings: string[] = [`"wght" ${lerp(weight, position).toFixed(1)}`];
    if (width) settings.push(`"wdth" ${lerp(width, position).toFixed(1)}`);
    if (slant) settings.push(`"slnt" ${lerp(slant, position).toFixed(2)}`);
    for (const [tag, range] of Object.entries(axes ?? {})) {
      settings.push(`"${tag}" ${lerp(range, position).toFixed(2)}`);
    }

    const glyph = (
      <span
        style={{
          display: "inline-block",
          whiteSpace: "pre",
          opacity: unit.opacity,
          fontVariationSettings: settings.join(", "),
          fontWeight: Math.round(lerp(weight, position)),
          ...(width
            ? { fontStretch: `${lerp(width, position).toFixed(1)}%` }
            : null),
        }}
      >
        {unit.text}
      </span>
    );

    if (!reserveSpace) return glyph;

    return (
      <span style={{ display: "inline-grid", whiteSpace: "pre" }}>
        <span
          aria-hidden
          style={{
            gridArea: "1 / 1",
            visibility: "hidden",
            fontVariationSettings: reserveSettings.join(", "),
            fontWeight: Math.round(heaviest),
            ...(widest !== undefined
              ? { fontStretch: `${widest.toFixed(1)}%` }
              : null),
          }}
        >
          {unit.text}
        </span>
        <span style={{ gridArea: "1 / 1", justifySelf: "center" }}>
          {glyph}
        </span>
      </span>
    );
  };

  return <SplitTextChars {...splitProps} effect="none" renderUnit={renderUnit} />;
};
