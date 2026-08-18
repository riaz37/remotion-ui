import { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import {
  resolveSpringConfig,
  type MotionSpring,
} from "@/remotion/lib/motion-primitive";
import { EASING_ENTER, EASING_EXIT } from "@/remotion/lib/timing";

export type CounterProps = {
  /** Value the count starts from. */
  from?: number;
  /** Value the count lands on. */
  to: number;
  durationInFrames?: number;
  delayInFrames?: number;
  /** Fixed decimal places. Also fixes the width, so nothing shifts. */
  decimals?: number;
  /** Group thousands with the locale's separator. */
  grouping?: boolean;
  /** Locale for grouping and decimal marks. */
  locale?: string;
  /** Full override of the number formatting. */
  format?: (value: number) => string;
  prefix?: string;
  suffix?: string;
  /**
   * Roll each digit like an odometer instead of swapping it. The lowest column
   * turns continuously; every column above it waits for the carry from below.
   */
  roll?: boolean;
  /** Drive the ramp with a spring instead of the ease-out curve. */
  spring?: MotionSpring;
  /** Small scale pop on the frame the number lands. */
  settle?: boolean;
  /**
   * Frame the number starts leaving on. Omit to hold the landed value for the
   * rest of the composition — inside a `TransitionSeries` the transition should
   * cover the tail rather than the number fading under it.
   */
  exitAtInFrames?: number;
  /** Frames the exit takes. */
  exitInFrames?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  fontFamily?: string;
  style?: React.CSSProperties;
};

/** Frames the landing pop takes. */
const SETTLE_FRAMES = 9;
/** Frames the exit takes when `exitAtInFrames` is set but `exitInFrames` is not. */
const DEFAULT_EXIT_FRAMES = 14;
const SETTLE_SCALE = 1.03;
/** A digit only turns over once the digits below it are nearly wrapped. */
const CARRY_START = 0.88;
/**
 * Height of one digit row as a share of the font size, and the line height of
 * the whole number with it.
 *
 * This is the single measurement the odometer stands on. Every slot — rolling
 * digit, separator, prefix — is a box of exactly this height with the glyph
 * placed by half-leading, so all of them resolve to the same baseline, and the
 * rolling columns are clipped to it. Slightly over 1em leaves room for the tail
 * of a comma without letting a neighbouring face show at rest.
 */
const ROW_RATIO = 1.1;

function buildFormatter({
  decimals,
  grouping,
  locale,
  format,
}: {
  decimals: number;
  grouping: boolean;
  locale?: string;
  format?: (value: number) => string;
}): (value: number) => string {
  if (format) return format;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouping,
  });

  return (value: number) => formatter.format(value);
}

/**
 * Animated number.
 *
 * Two things a counter has to get right: it must never resize while it runs —
 * a centred value that jumps a character wider on every tick reads as a bug —
 * and it must decelerate, because a number arriving at constant speed has no
 * moment of landing. The width is reserved from the longest value up front and
 * the ramp is an ease-out.
 */
export const Counter: React.FC<CounterProps> = ({
  from = 0,
  to,
  durationInFrames = 60,
  delayInFrames = 0,
  decimals = 0,
  grouping = true,
  locale,
  format,
  prefix = "",
  suffix = "",
  roll = false,
  spring: springProp,
  settle = true,
  exitAtInFrames,
  exitInFrames = DEFAULT_EXIT_FRAMES,
  fontSize: fontSizeProp,
  fontWeight = 700,
  color,
  fontFamily,
  style,
}) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(96, width);
  const rowHeight = Math.round(fontSize * ROW_RATIO);

  const formatValue = useMemo(
    () => buildFormatter({ decimals, grouping, locale, format }),
    [decimals, grouping, locale, format],
  );

  const progress = springProp
    ? spring({
        frame,
        fps,
        config: resolveSpringConfig(springProp),
        delay: delayInFrames,
        durationInFrames,
      })
    : interpolate(
        frame,
        [delayInFrames, delayInFrames + durationInFrames],
        [0, 1],
        {
          easing: EASING_ENTER,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      );

  const raw = interpolate(progress, [0, 1], [from, to]);
  const value = Number(raw.toFixed(decimals));

  /* The widest string either end of the ramp can produce reserves the box. */
  const widest = useMemo(() => {
    const a = formatValue(from);
    const b = formatValue(to);
    return a.length >= b.length ? a : b;
  }, [formatValue, from, to]);

  const landed = delayInFrames + durationInFrames;
  const pop = settle
    ? interpolate(
        frame,
        [landed - 1, landed + SETTLE_FRAMES * 0.35, landed + SETTLE_FRAMES],
        [1, SETTLE_SCALE, 1],
        {
          easing: EASING_ENTER,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      )
    : 1;

  /* The line height is the digit row, in both modes: turning `roll` on or off
   * must not move the number or change the space it takes in the layout. */
  // Exits accelerate away; entrances decelerate in. Never ease-out an exit.
  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(
          frame,
          [exitAtInFrames, exitAtInFrames + Math.max(1, exitInFrames)],
          [0, 1],
          {
            easing: EASING_EXIT,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        );

  const numberStyle: React.CSSProperties = {
    fontSize,
    fontWeight,
    fontVariantNumeric: "tabular-nums",
    lineHeight: `${rowHeight}px`,
    display: "inline-block",
    scale: pop,
    opacity: 1 - exit,
    translate: `0 ${exit * -fontSize * 0.22}px`,
    transformOrigin: "center center",
    ...(color !== undefined ? { color } : {}),
    ...(fontFamily !== undefined ? { fontFamily } : {}),
    ...style,
  };

  /* Roll keeps a fixed digit count, so prefix and suffix can sit beside it.
   * A reserved block is right-aligned inside its width, so they have to travel
   * with the number — parked outside, a short value opens a gap after them. */
  return (
    <span style={numberStyle}>
      {roll ? (
        <RollingNumber
          template={widest}
          raw={raw}
          decimals={decimals}
          rowHeight={rowHeight}
          prefix={prefix}
          suffix={suffix}
        />
      ) : (
        <ReservedNumber
          template={`${prefix}${widest}${suffix}`}
          text={`${prefix}${formatValue(value)}${suffix}`}
        />
      )}
    </span>
  );
};

/**
 * Holds the width of the longest value the counter can show, with the current
 * value laid over it, so the surrounding line never reflows.
 */
const ReservedNumber: React.FC<{ template: string; text: string }> = ({
  template,
  text,
}) => (
  <span style={{ display: "inline-grid", justifyItems: "end" }}>
    <span style={{ gridArea: "1 / 1", visibility: "hidden" }}>{template}</span>
    <span style={{ gridArea: "1 / 1" }}>{text}</span>
  </span>
);

type Slot =
  /** A wheel. `place` is its decimal place: 2 for a hundreds column, -1 for a tenth. */
  | { kind: "digit"; place: number }
  /**
   * A fixed character. `belongsAt` is the smallest magnitude at which it is
   * part of the value; `null` means it is always shown.
   */
  | { kind: "literal"; char: string; belongsAt: number | null };

/**
 * Splits a formatted template into wheels and fixed characters.
 *
 * A group separator is part of the value only once the value has reached the
 * column on its left — "999" carries no comma. Reading the place off the
 * left-hand neighbour gets that right for every grouping size, which counting
 * characters from the end of the string does not.
 */
function slotsOf(template: string, decimals: number): Slot[] {
  const digitCount = template.replace(/\D/g, "").length;
  const integerDigits = digitCount - decimals;
  let seen = 0;
  let lastPlace: number | null = null;

  return Array.from(template, (char) => {
    if (!/\d/.test(char)) {
      return { kind: "literal", char, belongsAt: lastPlace } as const;
    }

    const place = integerDigits - 1 - seen;
    seen += 1;
    lastPlace = place;
    return { kind: "digit", place } as const;
  });
}

const FACES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

/**
 * One slot of the number: a box exactly one digit tall with the glyph placed
 * by half-leading. Every slot in the row is built from this, so a separator, a
 * currency mark and a digit face all land on the same baseline at the same
 * size — the only thing that ever differs between them is what the box holds.
 */
const cellStyle = (rowHeight: number): React.CSSProperties => ({
  height: rowHeight,
  lineHeight: `${rowHeight}px`,
  textAlign: "center",
  /* A flex item collapses its own leading and trailing space, which would eat
   * the gap in a suffix written as " M". */
  whiteSpace: "pre",
});

/**
 * The odometer.
 *
 * Every column shows the true digit of the current value, so the number reads
 * correctly on any frame you stop on. Only the lowest column turns freely;
 * each column above it holds its face until the ones below are nearly wrapped
 * and then flips through in the last stretch of their turn, which is the carry
 * a mechanical counter makes.
 *
 * The wheel is a strip of eleven faces — 0 through 9 and 0 again, so the wrap
 * from nine is a turn forwards rather than a jump back — translated inside a
 * window one face tall. Nothing here scales, fades or blurs: a column that
 * changed size or weight as it moved would read as a different number sitting
 * at a different depth, which is exactly the failure this replaces.
 */
const RollingNumber: React.FC<{
  template: string;
  raw: number;
  decimals: number;
  /** Height of one digit face, and of the whole row. */
  rowHeight: number;
  prefix: string;
  suffix: string;
}> = ({ template, raw, decimals, rowHeight, prefix, suffix }) => {
  const slots = useMemo(() => slotsOf(template, decimals), [template, decimals]);
  const magnitude =
    Math.abs(raw) < 1 ? 0 : Math.floor(Math.log10(Math.abs(raw)));
  const cell = cellStyle(rowHeight);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "flex-start",
        height: rowHeight,
      }}
    >
      {prefix ? <span style={cell}>{prefix}</span> : null}

      {slots.map((slot, index) => {
        if (slot.kind === "literal") {
          /* Separators travel with the number, so they follow its own width. */
          const shown =
            slot.belongsAt === null
              ? slot.char !== "-" || raw < 0
              : magnitude >= slot.belongsAt;

          return (
            <span
              key={`literal-${index}`}
              style={{ ...cell, opacity: shown ? 1 : 0 }}
            >
              {slot.char}
            </span>
          );
        }

        const scaled = Math.abs(raw) / 10 ** slot.place;
        const digit = scaled % 10;
        const whole = Math.floor(digit);
        const frac = digit - whole;
        /* Only the lowest column shown turns freely; every column above it
         * waits for a carry. Gating on place 0 instead would leave the units
         * wheel of a decimal counter parked halfway through a face at rest,
         * because the digits it carries from are still on screen below it. */
        const shaped =
          slot.place <= -decimals
            ? frac
            : interpolate(frac, [CARRY_START, 1], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
        const offset = (whole + shaped) * rowHeight;
        /* Leading zeros stay blank until the value actually reaches them. */
        const lit = slot.place <= magnitude || slot.place <= 0;

        return (
          <span
            key={`digit-${index}`}
            style={{
              height: rowHeight,
              overflow: "hidden",
              display: "block",
              opacity: lit ? 1 : 0,
            }}
          >
            <span
              style={{
                display: "block",
                translate: `0px ${-offset}px`,
                willChange: "transform",
              }}
            >
              {FACES.map((face, row) => (
                <span key={`face-${row}`} style={{ ...cell, display: "block" }}>
                  {face}
                </span>
              ))}
            </span>
          </span>
        );
      })}

      {suffix ? <span style={cell}>{suffix}</span> : null}
    </span>
  );
};
