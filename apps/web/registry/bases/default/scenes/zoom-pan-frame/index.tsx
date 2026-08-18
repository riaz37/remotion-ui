import { loadFont } from "@remotion/google-fonts/Inter";
import { Video } from "@remotion/media";
import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";
import {
  getMediaObjectFitStyle,
  isVideoSource,
  type MediaFit,
} from "@/remotion/lib/media-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export type FocalPoint = {
  /** Horizontal focus, 0 (left edge) to 1 (right edge). */
  x?: number;
  /** Vertical focus, 0 (top edge) to 1 (bottom edge). */
  y?: number;
  /** Zoom at this end of the move. 1 is the untouched frame. */
  scale?: number;
};

export type ZoomPanFrameProps = {
  src: string;
  fit?: MediaFit;
  /** Where the move starts. */
  from?: FocalPoint;
  /** Where the move lands. */
  to?: FocalPoint;
  /**
   * Length of the move in frames. Defaults to the whole composition minus a
   * short settle, so the shot arrives rather than stopping dead on the cut.
   */
  moveInFrames?: number;
  /** Chip that rises once the move lands — location, source, timestamp. */
  label?: string;
  /** Corner darkening. 0 turns it off. */
  vignette?: number;
  backgroundColor?: string;
  accentColor?: string;
  theme?: "dark" | "light";
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const DEFAULT_FROM: Required<FocalPoint> = { x: 0.5, y: 0.5, scale: 1 };
const DEFAULT_TO: Required<FocalPoint> = { x: 0.5, y: 0.5, scale: 1.24 };

const resolve = (
  point: FocalPoint | undefined,
  fallback: Required<FocalPoint>,
): Required<FocalPoint> => ({
  x: point?.x ?? fallback.x,
  y: point?.y ?? fallback.y,
  scale: point?.scale ?? fallback.scale,
});

/**
 * A camera move on a still, driven by focal points rather than pixel offsets:
 * the transform origin travels from one point of interest to the other while
 * the zoom eases, so the framing lands on the subject at whatever size the
 * composition is — and it settles before the cut instead of stopping dead.
 */
export const ZoomPanFrame: React.FC<ZoomPanFrameProps> = ({
  src,
  fit = "cover",
  from,
  to,
  moveInFrames,
  label,
  vignette = 0.34,
  backgroundColor,
  accentColor = "#E8B86D",
  theme = "dark",
}) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });
  const u = Math.min(width / 1280, height / 720);

  const start = resolve(from, DEFAULT_FROM);
  const end = resolve(to, DEFAULT_TO);
  // Leaving a beat at the tail is what makes the move read as camera work; a
  // move that runs to the last frame reads as a jump cut.
  const move = moveInFrames ?? Math.max(durationInFrames - fps * 0.4, 1);

  const progress = interpolate(frame, [0, move], [0, 1], {
    easing: EASING.editorial,
    ...clamp,
  });
  const originX = interpolate(progress, [0, 1], [start.x, end.x]) * 100;
  const originY = interpolate(progress, [0, 1], [start.y, end.y]) * 100;
  const scale = interpolate(progress, [0, 1], [start.scale, end.scale]);

  const labelIn = label
    ? interpolate(frame, [move * 0.72, move * 0.72 + fps * 0.45], [0, 1], {
        easing: EASING.enter,
        ...clamp,
      })
    : 0;

  const mediaStyle = {
    ...getMediaObjectFitStyle(fit),
    scale: `${scale}`,
    transformOrigin: `${originX}% ${originY}%`,
  };

  return (
    <div
      style={{
        width,
        height,
        overflow: "hidden",
        background: backgroundColor ?? palette.page,
        fontFamily,
        position: "relative",
      }}
    >
      {isVideoSource(src) ? (
        <Video src={src} muted loop style={mediaStyle} />
      ) : (
        <Img src={src} style={mediaStyle} />
      )}

      {vignette > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 78% 78% at 50% 50%, transparent 42%, rgba(0,0,0,${vignette}) 100%)`,
          }}
        />
      ) : null}

      {label ? (
        <div
          style={{
            position: "absolute",
            left: safe.paddingLeft,
            bottom: safe.paddingBottom,
            display: "flex",
            alignItems: "center",
            gap: 10 * u,
            padding: `${10 * u}px ${16 * u}px`,
            borderRadius: 999,
            background: "rgba(8,8,11,0.62)",
            border: `1px solid ${accentColor}55`,
            color: "#F4F5F7",
            fontSize: 22 * u,
            fontWeight: 500,
            opacity: labelIn,
            translate: `0 ${(1 - labelIn) * 14 * u}px`,
          }}
        >
          <span
            style={{
              width: 8 * u,
              height: 8 * u,
              borderRadius: "50%",
              background: accentColor,
            }}
          />
          {label}
        </div>
      ) : null}
    </div>
  );
};
