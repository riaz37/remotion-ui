import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";

export type RgbGlitchTextProps = {
  text: string;
  delayInFrames?: number;
  durationInFrames?: number;
  glitchStartFrame?: number;
  glitchDurationInFrames?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  fontFamily?: string;
  redChannelColor?: string;
  cyanChannelColor?: string;
  accentColor?: string;
  glowColor?: string;
  intensity?: number;
  sliceCount?: number;
  maxWidth?: number | string;
  textAlign?: React.CSSProperties["textAlign"];
};

const DEFAULT_RED = "#f472b6";
const DEFAULT_CYAN = "#2dd4bf";
const DEFAULT_ACCENT = "#e8b86d";
const DEFAULT_FONT_FAMILY =
  "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pulse(frame: number, start: number, duration: number) {
  return interpolate(
    frame,
    [start, start + duration * 0.45, start + duration],
    [0, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );
}

function sliceOffset(index: number, burst: number, amplitude: number) {
  const direction = index % 2 === 0 ? 1 : -1;
  const variance = 0.52 + ((index * 37) % 41) / 100;
  return direction * burst * amplitude * variance;
}

export const RgbGlitchText: React.FC<RgbGlitchTextProps> = ({
  text,
  delayInFrames = 0,
  durationInFrames,
  glitchStartFrame,
  glitchDurationInFrames,
  fontSize: fontSizeProp,
  color = "#f4f4f5",
  fontWeight = 800,
  fontFamily,
  redChannelColor = DEFAULT_RED,
  cyanChannelColor = DEFAULT_CYAN,
  accentColor = DEFAULT_ACCENT,
  glowColor = "rgba(232,184,109,0.3)",
  intensity = 1,
  sliceCount = 5,
  maxWidth,
  textAlign = "center",
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(92, width);
  const start = glitchStartFrame ?? delayInFrames + 10;
  const duration = Math.max(6, glitchDurationInFrames ?? durationInFrames ?? 30);
  const localFrame = frame - start;
  const safeIntensity = clamp(intensity, 0, 2);
  const normalizedSliceCount = clamp(Math.round(sliceCount), 3, 9);
  const slices = Array.from({ length: normalizedSliceCount }, (_, index) => index);

  const firstBurst = pulse(localFrame, 0, duration * 0.34);
  const secondBurst = pulse(localFrame, duration * 0.42, duration * 0.28);
  const finalBurst = pulse(localFrame, duration * 0.72, duration * 0.2);
  const glitchAmount = Math.max(firstBurst, secondBurst * 0.82, finalBurst * 0.58);
  const settle = interpolate(localFrame, [duration * 0.72, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const channelOffset = glitchAmount * scaleFont(10, width) * safeIntensity;
  const sliceAmplitude = scaleFont(22, width) * safeIntensity;
  const scanlineOpacity = glitchAmount * 0.42;
  const glowOpacity = interpolate(
    Math.max(glitchAmount, settle * 0.45),
    [0, 1],
    [0.12, 0.54],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const baseTextStyle: React.CSSProperties = {
    display: "block",
    fontSize,
    fontWeight,
    lineHeight: 0.98,
    color,
    whiteSpace: "pre-wrap",
    textAlign,
    fontFamily: fontFamily ?? DEFAULT_FONT_FAMILY,
  };

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        maxWidth,
        isolation: "isolate",
        filter: `drop-shadow(0 0 ${scaleFont(24, width)}px ${glowColor})`,
      }}
    >
      <span
        style={{
          ...baseTextStyle,
          position: "relative",
          textShadow: `0 0 ${scaleFont(18, width)}px rgba(244,244,245,${glowOpacity * 0.24}), 0 0 ${scaleFont(42, width)}px ${glowColor}`,
        }}
      >
        {text}
      </span>
      <span
        aria-hidden
        style={{
          ...baseTextStyle,
          position: "absolute",
          inset: 0,
          color: redChannelColor,
          opacity: glitchAmount * 0.82,
          mixBlendMode: "screen",
          transform: `translate(${channelOffset * -1}px, ${firstBurst * scaleFont(-2, width)}px)`,
          zIndex: 1,
        }}
      >
        {text}
      </span>
      <span
        aria-hidden
        style={{
          ...baseTextStyle,
          position: "absolute",
          inset: 0,
          color: cyanChannelColor,
          opacity: glitchAmount * 0.82,
          mixBlendMode: "screen",
          transform: `translate(${channelOffset}px, ${secondBurst * scaleFont(2, width)}px)`,
          zIndex: 1,
        }}
      >
        {text}
      </span>
      {slices.map((index) => {
        const sliceHeight = 100 / normalizedSliceCount;
        const top = index * sliceHeight;
        const bottom = Math.max(0, 100 - top - sliceHeight * 0.72);
        const burst = index % 3 === 0 ? firstBurst : index % 3 === 1 ? secondBurst : finalBurst;
        const offset = sliceOffset(index, burst, sliceAmplitude);
        const colorShift = index % 2 === 0 ? cyanChannelColor : redChannelColor;

        return (
          <span
            key={index}
            aria-hidden
            style={{
              ...baseTextStyle,
              position: "absolute",
              inset: 0,
              color: index === normalizedSliceCount - 1 ? accentColor : colorShift,
              opacity: burst * (0.32 + index * 0.04),
              clipPath: `inset(${top}% 0 ${bottom}% 0)`,
              transform: `translateX(${offset}px)`,
              mixBlendMode: "screen",
              zIndex: 2,
            }}
          >
            {text}
          </span>
        );
      })}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: `${scaleFont(-8, width)}px 0`,
          opacity: scanlineOpacity,
          backgroundImage: `repeating-linear-gradient(180deg, transparent 0, transparent ${scaleFont(7, width)}px, ${accentColor}55 ${scaleFont(7, width)}px, ${accentColor}55 ${scaleFont(9, width)}px)`,
          transform: `translateY(${interpolate(localFrame, [0, duration], [scaleFont(-18, width), scaleFont(18, width)], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px)`,
          pointerEvents: "none",
          mixBlendMode: "screen",
          zIndex: 3,
        }}
      />
    </span>
  );
};
