import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING_ENTER, EASING_EXIT } from "@/remotion/lib/timing";

export type ImageExpandProps = {
  /**
   * The image the frame opens onto. Without one the frame expands as a tinted
   * plate — useful as a transition card, but it is not what the component is
   * named for, and it reads as an empty render.
   */
  src?: string;
  /** Headline set over the image once the frame has opened. */
  title?: string;
  /** Supporting line under the headline. */
  subtitle?: string;
  /** Small caps chip above the headline. */
  eyebrow?: string;
  accentColor?: string;
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const ImageExpand: React.FC<ImageExpandProps> = ({
  src,
  title,
  subtitle,
  eyebrow,
  accentColor = "#e8b86d",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Enter: the frame expands from a small card to fill the canvas. It starts
  // at frame 20 on purpose — `EASING_ENTER` is fast out of the gate, so an
  // earlier start leaves the 15% sample already near full frame and the open
  // never appears in a still.
  const expand = interpolate(frame, [20, 56], [0, 1], {
    easing: EASING_ENTER,
    ...clamp,
  });

  // Second beat: the copy lands as the frame finishes opening, so the hold
  // sample catches the composed frame rather than a bare image, and the 120
  // frames read as open-then-caption rather than as one size ramp.
  const captionIn = interpolate(frame, [50, 64], [0, 1], {
    easing: EASING_ENTER,
    ...clamp,
  });

  // Hold-with-life: once expanded, the glow breathes gently instead of
  // sitting frozen while we wait for the exit beat to begin.
  const breathe = interpolate(
    Math.sin((frame / fps) * Math.PI * 1.1),
    [-1, 1],
    [0.85, 1],
  );
  const holdEnvelope = interpolate(frame, [56, 70, 88, 104], [0, 1, 1, 0], clamp);

  // Exit: the frame settles inward and dims, closing the beat out. Opacity
  // fades linearly across the window so the beat reads clearly well before
  // the end (an ease-in curve would keep it near-invisible until the last
  // few frames); the shape settle keeps its ease-in curve for feel.
  // Centred on the last tenth of the window, and it settles on a dim frame
  // rather than on black — an exit that empties out leaves the tail a plate.
  const exitWindowStart = 100;
  const exitWindowEnd = 120;
  const exit = interpolate(frame, [exitWindowStart, exitWindowEnd], [0, 1], {
    easing: EASING_EXIT,
    ...clamp,
  });
  const exitOpacityProgress = interpolate(
    frame,
    [exitWindowStart, exitWindowEnd],
    [0, 1],
    clamp,
  );

  // Perceptual scale on the size ramp: 0.42 → 1 is a large change, and linear
  // interpolation of the edge length makes the middle of it read as a lurch.
  const w = interpolate(expand, [0, 1], [width * 0.42, width], {
    ...clamp,
    output: "perceptual-scale",
  });
  const h = interpolate(expand, [0, 1], [height * 0.38, height], {
    ...clamp,
    output: "perceptual-scale",
  });
  const radius = interpolate(expand, [0, 1], [24, 0]) + exit * 32;
  const scale = interpolate(exit, [0, 1], [1, 0.94], {
    ...clamp,
    output: "perceptual-scale",
  });
  const opacity = interpolate(exitOpacityProgress, [0, 1], [1, 0.4], clamp);
  const glowPulse = interpolate(breathe, [0.85, 1], [1, 1.25]);
  const glowStrength = 60 * expand * (1 + holdEnvelope * (glowPulse - 1));

  const unit = width / 960;
  const hasCopy = Boolean(title || subtitle || eyebrow);

  return (
    <AbsoluteFill style={{ background: "#080810", display: "grid", placeItems: "center" }}>
      <div
        style={{
          position: "relative",
          width: w,
          height: h,
          borderRadius: radius,
          overflow: "hidden",
          // Only visible when no image is supplied — an `objectFit: cover`
          // image covers it completely.
          background: src
            ? "#0b0b14"
            : `linear-gradient(135deg, ${accentColor}44, rgba(45,212,191,0.2))`,
          border: `1px solid ${accentColor}55`,
          boxShadow: `0 0 ${glowStrength}px ${accentColor}33`,
          opacity,
          scale,
        }}
      >
        {src ? (
          <Img
            src={src}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}

        {hasCopy ? (
          <>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: "58%",
                background:
                  "linear-gradient(to top, rgba(6,6,12,0.92) 0%, rgba(6,6,12,0.6) 44%, transparent 100%)",
                opacity: captionIn,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 54 * unit,
                right: 54 * unit,
                bottom: 46 * unit,
                display: "flex",
                flexDirection: "column",
                gap: 12 * unit,
                fontFamily: "system-ui, sans-serif",
                opacity: captionIn,
                translate: `0 ${(1 - captionIn) * 26 * unit}px`,
              }}
            >
              {eyebrow ? (
                <span
                  style={{
                    alignSelf: "flex-start",
                    padding: `${6 * unit}px ${14 * unit}px`,
                    borderRadius: 999,
                    border: `1px solid ${accentColor}66`,
                    background: `${accentColor}1f`,
                    color: accentColor,
                    fontSize: 18 * unit,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  {eyebrow}
                </span>
              ) : null}
              {title ? (
                <span
                  style={{
                    color: "#fafafa",
                    fontSize: 62 * unit,
                    fontWeight: 700,
                    lineHeight: 1.04,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {title}
                </span>
              ) : null}
              {subtitle ? (
                <span
                  style={{
                    color: "rgba(250,250,250,0.72)",
                    fontSize: 28 * unit,
                    fontWeight: 500,
                    lineHeight: 1.3,
                  }}
                >
                  {subtitle}
                </span>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
