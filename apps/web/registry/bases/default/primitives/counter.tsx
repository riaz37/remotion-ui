import { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import {
  resolveSpringConfig,
  type MotionSpring,
} from "@/remotion/lib/motion-primitive";
import { EASING_ENTER } from "@/remotion/lib/timing";

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
   * Roll each digit like an odometer instead of swapping it. Lower digits spin
   * continuously; higher ones only turn over as the ones below them wrap.
   */
  roll?: boolean;
  /** Drive the ramp with a spring instead of the ease-out curve. */
  spring?: MotionSpring;
  /** Small scale pop on the frame the number lands. */
  settle?: boolean;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  fontFamily?: string;
  style?: React.CSSProperties;
};

/** Frames the landing pop takes. */
const SETTLE_FRAMES = 9;
const SETTLE_SCALE = 1.03;
/** A digit only turns over once the digits below it are nearly wrapped. */
const CARRY_START = 0.88;

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
  fontSize: fontSizeProp,
  fontWeight = 700,
  color,
  fontFamily,
  style,
}) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(96, width);

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

  const numberStyle: React.CSSProperties = {
    fontSize,
    fontWeight,
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
    display: "inline-block",
    scale: pop,
    transformOrigin: "center bottom",
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
        <>
          {prefix}
          <RollingNumber
            template={widest}
            value={value}
            raw={raw}
            formatValue={formatValue}
            fontSize={fontSize}
          />
          {suffix}
        </>
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

/** Decimal place of each digit slot in a formatted template, e.g. 2 for a hundreds column. */
function placesOf(template: string, decimals: number): number[] {
  const digitCount = template.replace(/\D/g, "").length;
  const integerDigits = digitCount - decimals;
  let seen = 0;

  return Array.from(template, (char) => {
    if (!/\d/.test(char)) return Number.NaN;
    const place = integerDigits - 1 - seen;
    seen += 1;
    return place;
  });
}

const RollingNumber: React.FC<{
  template: string;
  value: number;
  raw: number;
  formatValue: (value: number) => string;
  fontSize: number;
}> = ({ template, value, raw, formatValue, fontSize }) => {
  const decimals = (formatValue(0).split(/[.,]/)[1] ?? "").length;
  const places = useMemo(() => placesOf(template, decimals), [template, decimals]);
  const rowHeight = Math.round(fontSize * 1.16);
  const magnitude = Math.abs(value) < 1 ? 0 : Math.floor(Math.log10(Math.abs(value)));
  const current = formatValue(value);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "flex-end",
        height: rowHeight,
      }}
    >
      {Array.from(template, (char, index) => {
        const place = places[index];

        if (Number.isNaN(place)) {
          /* Separators travel with the number, so they follow its own width. */
          return (
            <span
              key={`sep-${index}`}
              style={{
                height: rowHeight,
                display: "grid",
                placeItems: "center",
                opacity: current.length >= template.length - index ? 1 : 0,
              }}
            >
              {char}
            </span>
          );
        }

        const scaled = Math.abs(raw) / 10 ** place;
        const digit = scaled % 10;
        const whole = Math.floor(digit);
        const frac = digit - whole;
        /* The ones column spins freely; every column above it waits for a carry. */
        const shaped =
          place <= 0
            ? frac
            : interpolate(frac, [CARRY_START, 1], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
        const offset = (whole + shaped) * rowHeight;
        /* Leading zeros stay blank until the value actually reaches them. */
        const lit = place <= magnitude || place <= 0;

        return (
          <span
            key={`digit-${index}`}
            style={{
              height: rowHeight,
              overflow: "hidden",
              display: "inline-block",
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
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digitFace, row) => (
                <span
                  key={`face-${row}`}
                  style={{
                    display: "grid",
                    placeItems: "center",
                    height: rowHeight,
                  }}
                >
                  {digitFace}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
};
