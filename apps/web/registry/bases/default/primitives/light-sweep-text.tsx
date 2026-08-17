import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

export type LightSweepTextProps = {
  text: string;
  durationInFrames?: number;
  delayInFrames?: number;
  baseColor?: string;
  shineColor?: string;
  /**
   * Half-width of the shine, in percent of the gradient image. The image is
   * 2.2× the line, so 8 is a hard specular streak over roughly a third of the
   * line and 14 lights up about three fifths of it — wide enough that the band
   * is on the glyphs for nearly the whole travel instead of only mid-sweep.
   */
  bandWidth?: number;
  /**
   * Curve the highlight travels on. A specular sweep is physically constant
   * speed, so `Easing.linear` is the honest choice for a long sweep; the
   * ease-in-out default is kept for the short 48-frame accent it was tuned for.
   */
  easing?: (input: number) => number;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
};

export const LightSweepText: React.FC<LightSweepTextProps> = ({
  text,
  durationInFrames = 48,
  delayInFrames = 0,
  baseColor = "#71717a",
  shineColor = "#fafafa",
  bandWidth = 8,
  easing = EASING.editorial,
  fontSize: fontSizeProp,
  fontWeight = 700,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(84, width);
  const sweep = interpolate(
    frame,
    [delayInFrames, delayInFrames + durationInFrames],
    [120, -20],
    {
      easing,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const band = Math.max(1, Math.min(49, bandWidth));

  return (
    <span
      style={{
        fontSize,
        fontWeight,
        lineHeight: 1.1,
        backgroundImage: `linear-gradient(105deg, ${baseColor} 0%, ${baseColor} ${50 - band}%, ${shineColor} 50%, ${baseColor} ${50 + band}%, ${baseColor} 100%)`,
        backgroundSize: "220% 100%",
        backgroundPosition: `${sweep}% 0`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        ...(fontFamily ? { fontFamily } : {}),
      }}
    >
      {text}
    </span>
  );
};
