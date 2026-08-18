import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";

export type DepthOfFieldLayer = {
  /** What sits on this plane. */
  content: ReactNode;
  /** Distance from the lens, 0 nearest to 1 furthest. */
  depth: number;
  style?: CSSProperties;
};

export type DepthOfFieldBlurProps = {
  /** Back to front. The last entry is drawn on top. */
  layers: DepthOfFieldLayer[];
  /** Depth the lens starts focused on. */
  focusFrom?: number;
  /** Depth the lens racks to. Equal to `focusFrom` holds the focus still. */
  focusTo?: number;
  /** Frame the rack starts on. */
  startAtInFrames?: number;
  /** Length of the rack. Defaults to most of the surrounding window. */
  durationInFrames?: number;
  /** Blur at maximum defocus, in px. */
  maxBlur?: number;
  /**
   * How fast focus falls off with distance. A wide aperture — a high number —
   * throws a plane out of focus over a very short depth change.
   */
  aperture?: number;
  /** How much an out-of-focus plane darkens, 0–1. */
  dim?: number;
  /** Scale a defocused plane picks up — breathing, as a real lens does. */
  breathe?: number;
  /** Drive the rack yourself, 0–1. Overrides the frame-based timing. */
  progress?: number;
  backgroundColor?: string;
};

/**
 * A rack focus across depth planes.
 *
 * Spatial, unlike `blur-focus-in`, which resolves a single piece of type: here
 * every plane is blurred by its *distance from the focal plane*, so racking the
 * focus pulls one layer in exactly as it pushes another out. That relationship
 * is the shot — blurring one element on its own reads as an effect, not as a
 * camera.
 *
 * Two details do most of the convincing. Defocused planes dim slightly, because
 * a lens spreads the same light over a larger circle of confusion; and they
 * scale slightly, which is the focus breathing every real lens has. Both are
 * small enough to be invisible on their own and obvious by their absence.
 */
export const DepthOfFieldBlur: React.FC<DepthOfFieldBlurProps> = ({
  layers,
  focusFrom = 0,
  focusTo = 1,
  startAtInFrames = 6,
  durationInFrames,
  maxBlur = 16,
  aperture = 2.2,
  dim = 0.35,
  breathe = 0.03,
  progress,
  backgroundColor = "#07080e",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames: windowFrames } = useVideoConfig();

  // A rack that finishes early leaves the tail of the shot static; one that
  // finishes on the last frame never lands. 78% of the window is the
  // compromise, and it is what the still audit samples at 90% will see.
  const span = Math.max(1, Math.round(durationInFrames ?? windowFrames * 0.78));
  const swept =
    progress ??
    interpolate(frame, [startAtInFrames, startAtInFrames + span], [0, 1], {
      easing: EASING.editorial,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const focus = focusFrom + (focusTo - focusFrom) * swept;

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      {layers.map((layer, index) => {
        const distance = Math.min(1, Math.abs(layer.depth - focus) * aperture);
        const blur = distance * maxBlur;

        return (
          <AbsoluteFill
            key={index}
            style={{
              filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
              opacity: 1 - dim * distance,
              scale: `${(1 + breathe * distance).toFixed(4)}`,
              willChange: "filter",
              ...layer.style,
            }}
          >
            {layer.content}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
