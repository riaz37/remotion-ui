import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export type WeatherCondition = "sun" | "cloud" | "rain" | "snow";

export type ForecastDay = {
  /** Two or three letters — the row divides the card width evenly. */
  label: string;
  condition: WeatherCondition;
  high: number;
  low: number;
};

export type WeatherCardProps = {
  /** Place name across the top. */
  place?: string;
  /** Line under the place — a time, a date, "feels like". */
  detail?: string;
  /** The temperature the card counts up to. */
  temperature?: number;
  /** Degree suffix. */
  unit?: string;
  condition?: WeatherCondition;
  /** Words under the temperature. */
  conditionLabel?: string;
  forecast?: ForecastDay[];
  /** Second the temperature starts counting. */
  temperatureAtSeconds?: number;
  /** How long the count takes. */
  countSeconds?: number;
  /** Second the first forecast day arrives. */
  forecastAtSeconds?: number;
  /** Seconds between forecast days. */
  staggerSeconds?: number;
  /**
   * Seconds the card holds before it retreats. Omit to leave it up — the
   * iconography keeps moving either way.
   */
  holdSeconds?: number;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_FORECAST: ForecastDay[] = [
  { label: "Sat", condition: "sun", high: 24, low: 14 },
  { label: "Sun", condition: "cloud", high: 22, low: 13 },
  { label: "Mon", condition: "rain", high: 18, low: 12 },
  { label: "Tue", condition: "rain", high: 17, low: 11 },
  { label: "Wed", condition: "sun", high: 21, low: 12 },
];

/** Beat plan in seconds. Temperature and forecast times come from the props. */
const T = {
  card: 0,
  cardFor: 0.46,
  head: 0.14,
  headFor: 0.42,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const CONDITION_COLORS: Record<WeatherCondition, string> = {
  sun: "#E8B86D",
  cloud: "#9AA4B4",
  rain: "#7DD3E8",
  snow: "#CFE4F0",
};

/**
 * Weather iconography that never stops: rays turn, clouds drift, drops and
 * flakes fall on a loop of their own.
 *
 * Every moving part is a pure function of the frame — `frame * rate` wrapped
 * into its own period, with per-particle offsets derived from the particle's
 * index. Nothing accumulates state, so a frame rendered out of order on a render
 * farm is identical to the same frame rendered in sequence.
 */
const WeatherGlyph: React.FC<{
  condition: WeatherCondition;
  size: number;
  frame: number;
  fps: number;
  color: string;
}> = ({ condition, size, frame, fps, color }) => {
  const seconds = frame / fps;

  if (condition === "sun") {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <g
          style={{
            transformOrigin: "24px 24px",
            rotate: `${seconds * 22}deg`,
          }}
        >
          {Array.from({ length: 8 }, (_, index) => {
            const angle = (index / 8) * Math.PI * 2;
            // Rays breathe out of phase with each other so the sun pulses
            // rather than scaling as one lump.
            const beat = 1 + Math.sin(seconds * 3 + index) * 0.08;
            return (
              <line
                key={index}
                x1={24 + Math.cos(angle) * 13}
                y1={24 + Math.sin(angle) * 13}
                x2={24 + Math.cos(angle) * 19 * beat}
                y2={24 + Math.sin(angle) * 19 * beat}
                stroke={color}
                strokeWidth={2.4}
                strokeLinecap="round"
                opacity={0.85}
              />
            );
          })}
        </g>
        <circle cx={24} cy={24} r={9.5} fill={color} opacity={0.9} />
      </svg>
    );
  }

  const drift = Math.sin(seconds * 1.1) * 2.4;

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <g transform={`translate(${drift} 0)`}>
        <ellipse cx={20} cy={22} rx={11} ry={8} fill={color} opacity={0.85} />
        <ellipse cx={30} cy={24} rx={9} ry={6.5} fill={color} opacity={0.7} />
      </g>
      {condition === "rain" || condition === "snow"
        ? Array.from({ length: 5 }, (_, index) => {
            const period = condition === "rain" ? 0.62 : 1.5;
            // Each drop keeps its own phase, so the fall reads as weather
            // rather than as five things doing the same thing at once.
            const phase = ((seconds / period) + index * 0.21) % 1;
            const x = 12 + index * 6;
            const y = 32 + phase * 12;
            return condition === "rain" ? (
              <line
                key={index}
                x1={x}
                y1={y}
                x2={x - 1.4}
                y2={y + 4.2}
                stroke={CONDITION_COLORS.rain}
                strokeWidth={1.9}
                strokeLinecap="round"
                opacity={0.9 * Math.sin(Math.PI * phase)}
              />
            ) : (
              <circle
                key={index}
                cx={x + Math.sin(phase * Math.PI * 2 + index) * 1.6}
                cy={y}
                r={1.6}
                fill={CONDITION_COLORS.snow}
                opacity={0.9 * Math.sin(Math.PI * phase)}
              />
            );
          })
        : null}
    </svg>
  );
};

export const WeatherCard: React.FC<WeatherCardProps> = ({
  place = "Lisbon",
  detail = "Saturday · 14:20",
  temperature = 24,
  unit = "°",
  condition = "sun",
  conditionLabel = "Clear, light breeze",
  forecast = DEFAULT_FORECAST,
  temperatureAtSeconds = 0.4,
  countSeconds = 1,
  forecastAtSeconds = 1.4,
  staggerSeconds = 0.34,
  holdSeconds,
  accentColor = "#E8B86D",
  backgroundColor,
  theme = "dark",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });

  const portrait = height > width;
  const u = portrait
    ? Math.min(width / 620, height / 1120)
    : Math.min(width / 1280, height / 720);

  const cardIn = spring({
    frame: frame - at(T.card),
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });
  const open = ease(T.card, T.card + T.cardFor, EASING.editorial);
  const headIn = ease(T.head, T.head + T.headFor);

  const count = ease(
    temperatureAtSeconds,
    temperatureAtSeconds + countSeconds,
    EASING.editorial,
  );
  const shown = Math.round(interpolate(count, [0, 1], [0, temperature]));

  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const cardW = Math.min(width - safe.paddingLeft - safe.paddingRight, 660 * u);
  const pad = 34 * u;
  const glyphColor = CONDITION_COLORS[condition];

  return (
    <AbsoluteFill
      style={{
        background: backgroundColor ?? palette.page,
        fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `${safe.paddingTop}px ${safe.paddingRight}px`,
      }}
    >
      <div
        style={{
          width: cardW,
          borderRadius: 28 * u,
          background: palette.window,
          border: `1px solid ${palette.border}`,
          boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${26 * u}px ${
            64 * u
          }px ${palette.shadow}`,
          padding: pad,
          position: "relative",
          overflow: "hidden",
          clipPath: `inset(0 0 ${(1 - open) * 100}% 0 round ${28 * u}px)`,
          opacity: 1 - exit,
          translate: `0 ${(1 - cardIn) * 22 * u + exit * 30 * u}px`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(120% 90% at 88% 0%, ${glyphColor}20, transparent 60%)`,
          }}
        />

        <div style={{ position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              opacity: headIn,
              translate: `0 ${(1 - headIn) * 10 * u}px`,
            }}
          >
            <div>
              <div
                style={{
                  color: palette.fg,
                  fontSize: 27 * u,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                }}
              >
                {place}
              </div>
              {detail ? (
                <div
                  style={{
                    marginTop: 3 * u,
                    color: palette.dim,
                    fontSize: 17.5 * u,
                    fontWeight: 500,
                  }}
                >
                  {detail}
                </div>
              ) : null}
            </div>
            <WeatherGlyph
              condition={condition}
              size={76 * u}
              frame={frame}
              fps={fps}
              color={glyphColor}
            />
          </div>

          <div
            style={{
              marginTop: 14 * u,
              display: "flex",
              alignItems: "flex-start",
              opacity: count > 0 ? 1 : 0,
            }}
          >
            <span
              style={{
                color: palette.fg,
                fontSize: 96 * u,
                fontWeight: 800,
                letterSpacing: "-0.05em",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                translate: `0 ${(1 - count) * 10 * u}px`,
              }}
            >
              {shown}
            </span>
            <span
              style={{
                marginTop: 6 * u,
                // Brand accent, not the weather colour: the degree symbol
                // should not change hue when the conditions do.
                color: accentColor,
                fontSize: 42 * u,
                fontWeight: 700,
              }}
            >
              {unit}
            </span>
          </div>

          {conditionLabel ? (
            <div
              style={{
                marginTop: 2 * u,
                color: palette.dim,
                fontSize: 19 * u,
                fontWeight: 500,
                opacity: interpolate(count, [0.5, 1], [0, 1], clamp),
              }}
            >
              {conditionLabel}
            </div>
          ) : null}

          <div
            style={{
              marginTop: 24 * u,
              paddingTop: 20 * u,
              borderTop: `1px solid ${palette.border}`,
              display: "flex",
            }}
          >
            {forecast.map((day, index) => {
              const dayAt = forecastAtSeconds + index * staggerSeconds;
              const dayIn = ease(dayAt, dayAt + 0.36);
              return (
                <div
                  key={day.label}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6 * u,
                    opacity: dayIn,
                    translate: `0 ${(1 - dayIn) * 12 * u}px`,
                  }}
                >
                  <span
                    style={{
                      color: palette.dim,
                      fontSize: 15 * u,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {day.label}
                  </span>
                  <WeatherGlyph
                    condition={day.condition}
                    size={38 * u}
                    // Each column runs its own clock so the row is never five
                    // glyphs moving in lockstep.
                    frame={frame + index * 9}
                    fps={fps}
                    color={CONDITION_COLORS[day.condition]}
                  />
                  <span
                    style={{
                      color: palette.fg,
                      fontSize: 17 * u,
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {day.high}
                    {unit}
                  </span>
                  <span
                    style={{
                      color: palette.faint,
                      fontSize: 15 * u,
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {day.low}
                    {unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
