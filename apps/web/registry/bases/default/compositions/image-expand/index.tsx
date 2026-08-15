import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING_ENTER, EASING_EXIT } from "@/remotion/lib/timing";

export type ImageExpandProps = {
  /**
   * The image the frame opens onto. Without one the frame expands as a tinted
   * plate — useful as a transition card, but it is not what the component is
   * named for, and it reads as an empty render.
   */
  src?: string;
  accentColor?: string;
};

export const ImageExpand: React.FC<ImageExpandProps> = ({
  src,
  accentColor = "#e8b86d",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Enter: the frame expands from a small card to fill the canvas.
  const expand = interpolate(frame, [20, 70], [0, 1], {
    easing: EASING_ENTER,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Hold-with-life: once expanded, the glow breathes gently instead of
  // sitting frozen while we wait for the exit beat to begin.
  const breathe = interpolate(
    Math.sin((frame / fps) * Math.PI * 1.1),
    [-1, 1],
    [0.85, 1],
  );
  const holdEnvelope = interpolate(frame, [70, 85, 95, 110], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit: the frame settles inward and fades, closing the beat out. Opacity
  // fades linearly across the window so the beat reads clearly well before
  // the end (an ease-in curve would keep it near-invisible until the last
  // few frames); the shape settle keeps its ease-in curve for feel.
  // Centred on the last tenth of the window: an exit that completes earlier
  // leaves the tile holding an empty frame for the rest of every loop.
  const exitWindowStart = 96;
  const exitWindowEnd = 120;
  const exit = interpolate(frame, [exitWindowStart, exitWindowEnd], [0, 1], {
    easing: EASING_EXIT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitOpacityProgress = interpolate(frame, [exitWindowStart, exitWindowEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const w = interpolate(expand, [0, 1], [width * 0.32, width]);
  const h = interpolate(expand, [0, 1], [height * 0.28, height]);
  const radius = interpolate(expand, [0, 1], [24, 0]) + exit * 32;
  const scale = 1 - exit * 0.06;
  const opacity = 1 - exitOpacityProgress;
  const glowPulse = interpolate(breathe, [0.85, 1], [1, 1.25]);
  const glowStrength = 60 * expand * (1 + holdEnvelope * (glowPulse - 1));

  return (
    <AbsoluteFill style={{ background: "#080810", display: "grid", placeItems: "center" }}>
      <div
        style={{
          width: w,
          height: h,
          borderRadius: radius,
          overflow: "hidden",
          background: `linear-gradient(135deg, ${accentColor}44, rgba(45,212,191,0.2))`,
          border: `1px solid ${accentColor}55`,
          boxShadow: `0 0 ${glowStrength}px ${accentColor}33`,
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        {src ? (
          <Img
            src={src}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
