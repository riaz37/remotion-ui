import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";

export type ParallaxLayer = {
  /** What this plane holds. Anything: an image, a scene, a headline. */
  content: ReactNode;
  /**
   * Distance from the camera. 0 sits on the focal plane and never moves; 1 is
   * nearest and travels the full `travel`. Negative depths move the other way,
   * which is what a foreground element in front of the lens does.
   */
  depth?: number;
  /** Defocus for this plane, in px. */
  blur?: number;
  /** Plane opacity — the cheap way to push a plate into haze. */
  opacity?: number;
  /** Extra scale on this plane, on top of the depth-derived one. */
  scale?: number;
  style?: CSSProperties;
};

export type ParallaxLayersProps = {
  /** Back to front. The last entry is drawn on top. */
  layers: ParallaxLayer[];
  /** Travel of a `depth={1}` plane across the whole move, in px. */
  travel?: number;
  /** Direction of the camera move in degrees. 0 tracks right, 90 cranes down. */
  angle?: number;
  /** Extra scale the nearest plane picks up across the move. 0 is a flat track. */
  zoom?: number;
  /** Drive the move yourself, 0–1. Overrides the frame-based sweep. */
  progress?: number;
  /** Frame the sweep starts on. */
  startAtInFrames?: number;
  /** Length of the sweep. Defaults to the surrounding composition or sequence. */
  durationInFrames?: number;
  /** `ease` settles at both ends; `linear` is a constant-speed dolly. */
  motion?: "ease" | "linear";
  /** Plate behind every plane. */
  backgroundColor?: string;
};

/**
 * Depth-offset planes driven by one camera move.
 *
 * Multi-layer, unlike `zoom-pan-frame`, which is a camera move on a single
 * still. The point of the split is that parallax is a *relationship*: the
 * illusion comes from planes moving at different rates against each other, so
 * one driver has to feed all of them. Each plane's offset is `depth × travel`,
 * which means depth is the only number a caller has to think about, and a plane
 * at `depth={0}` is the focal plane everything else moves relative to.
 *
 * The sweep runs from -0.5 to 0.5, so the middle of the window is the layout
 * you composed — planes are offset in both directions around it rather than
 * starting in frame and sliding out.
 */
export const ParallaxLayers: React.FC<ParallaxLayersProps> = ({
  layers,
  travel = 320,
  angle = 0,
  zoom = 0.12,
  progress,
  startAtInFrames = 0,
  durationInFrames,
  motion = "ease",
  backgroundColor = "#07080e",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames: windowFrames } = useVideoConfig();

  const span = Math.max(1, Math.round(durationInFrames ?? windowFrames));
  const swept =
    progress ??
    interpolate(frame, [startAtInFrames, startAtInFrames + span], [0, 1], {
      easing: motion === "ease" ? EASING.editorial : undefined,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const drive = swept - 0.5;

  const radians = (angle * Math.PI) / 180;
  const dirX = Math.cos(radians);
  const dirY = Math.sin(radians);

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      {layers.map((layer, index) => {
        const depth = layer.depth ?? index / Math.max(1, layers.length - 1);
        const offset = -drive * travel * depth;
        // Nearer planes grow into the move; that is what separates a dolly from
        // a pan and it is the half people forget.
        const scale = (layer.scale ?? 1) * (1 + zoom * depth * (0.5 + drive));

        return (
          <AbsoluteFill
            key={index}
            style={{
              transform: `translate(${(offset * dirX).toFixed(2)}px, ${(offset * dirY).toFixed(2)}px) scale(${scale.toFixed(4)})`,
              filter: layer.blur ? `blur(${layer.blur}px)` : undefined,
              opacity: layer.opacity ?? 1,
              willChange: "transform",
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
