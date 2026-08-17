import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

export type StrikethroughReplaceProps = {
  /** Phrase that gets struck out. */
  from: string;
  /** Phrase that takes its place. */
  to: string;
  /** Frames before the stroke starts travelling. */
  delayInFrames?: number;
  /** Length of the stroke's travel across `from`. */
  strikeDurationInFrames?: number;
  /** Beat held on the struck-out phrase before it leaves. */
  holdInFrames?: number;
  /** Length of the old phrase's departure. */
  departDurationInFrames?: number;
  /** Frames after the stroke lands before `to` starts arriving. */
  replaceDelayInFrames?: number;
  /** Length of the new phrase's arrival. */
  replaceDurationInFrames?: number;
  /** Vertical handoff distance, in em. Old lifts by it, new rises from it. */
  travel?: number;
  /** Thickness of the stroke, in em. */
  strikeWeight?: number;
  /**
   * Height of the stroke above the baseline, in `ex` — that is, in units of the
   * font's own x-height. `0.5` is centred through the lowercase mass.
   */
  strikeHeight?: number;
  /** Angle of the stroke in degrees off level — a hand does not rule it flat. */
  tilt?: number;
  color?: string;
  strikeColor?: string;
  /** Ink of the replacement. Defaults to `color`. */
  replaceColor?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  style?: React.CSSProperties;
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * Line box both phrases share, so the new line lands on the old line's baseline
 * rather than near it. Nothing about the stroke is measured against it — see
 * the note on the stroke layer.
 */
const LINE_HEIGHT = 1.15;
/** Stroke overshoot past each end of the phrase, in em. A pen does not stop on the glyph. */
const OVERHANG = 0.06;
/** Opacity is gone this far into the departure — the tail of the lift is unseen. */
const DEPART_OPACITY_LEAD = 0.62;
/** Opacity is complete this far into the arrival — the last of the rise is opaque. */
const ARRIVE_OPACITY_LEAD = 0.55;

/**
 * Strikes out one phrase and puts another in its place — the correction gesture.
 *
 * The whole component is the timing relationship between three beats, and they
 * run in order rather than as one cross-fade:
 *
 * 1. **The stroke travels.** `strikeDurationInFrames` across the full width of
 *    `from`, on an ease-in-out, because a hand accelerates off the first letter
 *    and decelerates onto the last. It is drawn once, at full length, so the
 *    reader sees the old phrase cancelled before anything moves.
 * 2. **The old phrase leaves.** After `holdInFrames` it lifts by `travel` and
 *    fades on an ease-in. The stroke leaves inside that layer rather than being
 *    switched off — a rule that vanishes on its own frame reads as a glitch,
 *    while one that travels out with the text it cancelled reads as one object.
 * 3. **The new phrase arrives**, `replaceDelayInFrames` after the stroke lands,
 *    rising from `travel` below.
 *
 * The defaults open the arrival as the departure passes half, which is the
 * narrow window where the line is neither empty nor doubled. Opacity leads in
 * both directions — gone at 62% of the lift, complete at 55% of the rise — so by
 * the time the new phrase is readable the old one has gone, and while both are
 * faint they are travelling in opposite directions. Push `replaceDelayInFrames`
 * past `holdInFrames + departDurationInFrames` and the line goes briefly empty,
 * which reads as a dropout rather than a beat.
 *
 * Both phrases occupy the same grid cell, so the box is as wide as the longer of
 * the two for the whole shot and a centred line never reflows on the swap.
 */
export const StrikethroughReplace: React.FC<StrikethroughReplaceProps> = ({
  from,
  to,
  delayInFrames = 0,
  strikeDurationInFrames = 16,
  holdInFrames = 4,
  departDurationInFrames = 12,
  replaceDelayInFrames = 10,
  replaceDurationInFrames = 20,
  travel = 0.42,
  strikeWeight = 0.07,
  strikeHeight = 0.5,
  tilt = -0.6,
  color = "#ececec",
  strikeColor = "#e8b86d",
  replaceColor,
  fontSize: fontSizeProp,
  fontWeight = 600,
  fontFamily,
  textAlign = "center",
  style,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(72, width);

  /* Every beat is stated relative to the frame the stroke lands on, so changing
   * the stroke's length moves the departure and the arrival with it instead of
   * silently opening a gap in the middle of the gesture. */
  const struck = delayInFrames + strikeDurationInFrames;

  const sweep = interpolate(
    frame,
    [delayInFrames, struck],
    [0, 1],
    { easing: EASING.editorial, ...clamp },
  );

  const departStart = struck + holdInFrames;
  const departTime = interpolate(
    frame,
    [departStart, departStart + departDurationInFrames],
    [0, 1],
    clamp,
  );
  const depart = interpolate(departTime, [0, 1], [0, 1], {
    easing: EASING.exit,
    ...clamp,
  });
  const departOpacity = interpolate(
    departTime,
    [0, DEPART_OPACITY_LEAD],
    [1, 0],
    { easing: EASING.exit, ...clamp },
  );

  const arriveStart = struck + replaceDelayInFrames;
  const arriveTime = interpolate(
    frame,
    [arriveStart, arriveStart + replaceDurationInFrames],
    [0, 1],
    clamp,
  );
  const arrive = interpolate(arriveTime, [0, 1], [0, 1], {
    easing: EASING.enter,
    ...clamp,
  });
  const arriveOpacity = interpolate(
    arriveTime,
    [0, ARRIVE_OPACITY_LEAD],
    [0, 1],
    { easing: EASING.enter, ...clamp },
  );

  const justify =
    textAlign === "center"
      ? "center"
      : textAlign === "right"
        ? "end"
        : "start";

  /* The stroke is placed from the baseline, in the font's own x-height.
   *
   * It is an inline-block inside the stroke layer, not an absolutely positioned
   * bar: an inline box is aligned by `vertical-align`, which is measured from
   * the parent's baseline, so `strikeHeight` in `ex` puts the stroke's centre
   * exactly half an x-height above the baseline whatever the size, weight,
   * family or line height. A rule positioned against the line box instead —
   * `top: 50%`, or an em offset from the top of the em box — is thrown off by
   * half-leading the moment `lineHeight` changes, and is only ever right for the
   * one face it was eyeballed on. The negative bottom margin re-centres the box
   * on that height, since an inline-block's baseline is its bottom edge. */
  const strikeShift = `-${(strikeWeight / 2).toFixed(4)}em`;

  return (
    <span
      style={{
        display: "inline-grid",
        justifyItems: justify,
        color,
        fontSize,
        fontWeight,
        lineHeight: LINE_HEIGHT,
        ...(fontFamily !== undefined ? { fontFamily } : {}),
        ...style,
      }}
    >
      <span
        style={{
          gridArea: "1 / 1",
          opacity: departOpacity,
          transform: `translateY(${-depart * travel}em)`,
        }}
      >
        <span
          style={{
            position: "relative",
            display: "inline-block",
            whiteSpace: "nowrap",
          }}
        >
          {from}
          {/* The layer covers the phrase's own line box, so the line it lays out
            * shares that box's baseline. It turns about its centre so `tilt`
            * costs the same deviation at both ends; pivoting on one end drops
            * the far end of a long phrase clear of the letters. The sweep is
            * scaled inside the rotation rather than outside it — scaling a
            * rotated box stretches it along the frame's axis, not its own. */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              transform: `rotate(${tilt}deg)`,
              transformOrigin: "center center",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: `calc(100% + ${2 * OVERHANG}em)`,
                marginLeft: `${-OVERHANG}em`,
                marginBottom: strikeShift,
                verticalAlign: `${strikeHeight}ex`,
                height: `${strikeWeight}em`,
                borderRadius: `${strikeWeight / 2}em`,
                background: strikeColor,
                transform: `scaleX(${sweep})`,
                transformOrigin: "left center",
              }}
            />
          </span>
        </span>
      </span>
      <span
        style={{
          gridArea: "1 / 1",
          color: replaceColor ?? color,
          opacity: arriveOpacity,
          transform: `translateY(${(1 - arrive) * travel}em)`,
          whiteSpace: "nowrap",
        }}
      >
        {to}
      </span>
    </span>
  );
};
