import { useMemo, type CSSProperties, type ReactNode } from "react";
import { interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import {
  applyEffectors,
  layoutClones,
  type CloneState,
  type ClonerLayout,
  type Effector,
} from "@/remotion/lib/mograph";

export type {
  ClonerLayout,
  CloneState,
  Effector,
  FalloffField,
} from "@/remotion/lib/mograph";

/** What a custom clone renderer receives. */
export type CloneRenderState = CloneState & {
  /** Base colour with every effector tint blended in. */
  color: string;
};

export type EffectorFieldProps = {
  /** How the clones are arranged. Coordinates are centred on the stage. */
  layout: ClonerLayout;
  /** Run in order; each one's fields are sampled at the clones' rest positions. */
  effectors?: Effector[];
  width?: number;
  height?: number;
  /** Size of the default clone, or of the box each child is centred in. */
  cloneSize?: number;
  /** Clone colour before any effector tints it. Children can read it as `currentColor`. */
  color?: string;
  /** The element to clone. Painted in `currentColor`; defaults to a rounded tile. */
  children?: ReactNode;
  /** Per-clone renderer, for clones that need their own content. Wins over `children`. */
  renderClone?: (clone: CloneRenderState) => ReactNode;
  /** Camera distance for z moves and x/y rotations, pixels. */
  perspective?: number;
  /** Tilts the whole cloner plane away from the camera, degrees about x. */
  tilt?: number;
  /** Render a specific frame instead of the current one. */
  frame?: number;
  style?: CSSProperties;
  className?: string;
};

function tint(base: string, tints: CloneState["tints"]): string {
  return tints.reduce(
    (color, layer) =>
      interpolateColors(Math.min(1, Math.max(0, layer.weight)), [0, 1], [color, layer.color]),
    base,
  );
}

/**
 * Cinema 4D's MoGraph cloner with effectors. Clone anything into a grid,
 * honeycomb, ring or line; fields decide how strongly each clone is affected,
 * and effectors turn that into lift, scale, rotation, opacity and colour.
 * Fields and effector values are `Animatable`, so a field can travel on a
 * keyframed path or follow an expression, and the result is deterministic.
 */
export const EffectorField: React.FC<EffectorFieldProps> = ({
  layout,
  effectors = [],
  width = 800,
  height = 450,
  cloneSize = 18,
  color = "#f4f4f5",
  children,
  renderClone,
  perspective = 1400,
  tilt = 0,
  frame: frameOverride,
  style,
  className,
}) => {
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frame = frameOverride ?? currentFrame;

  const clones = useMemo(() => layoutClones(layout), [layout]);
  const states = useMemo(
    () => applyEffectors(clones, effectors, { frame, fps }),
    [clones, effectors, frame, fps],
  );

  const half = cloneSize / 2;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width,
        height,
        perspective,
        perspectiveOrigin: "50% 40%",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: width / 2,
          top: height / 2,
          transformStyle: "preserve-3d",
          transform: tilt ? `rotateX(${tilt}deg)` : undefined,
        }}
      >
        {states.map((state) => {
          if (state.opacity <= 0.002) return null;
          const cloneColor = tint(color, state.tints);
          const content = renderClone
            ? renderClone({ ...state, color: cloneColor })
            : (children ?? (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: cloneSize * 0.22,
                    background: "currentColor",
                  }}
                />
              ));
          return (
            <div
              key={state.index}
              style={{
                position: "absolute",
                left: -half,
                top: -half,
                width: cloneSize,
                height: cloneSize,
                display: "grid",
                placeItems: "center",
                color: cloneColor,
                opacity: state.opacity,
                transform:
                  `translate3d(${state.x}px, ${state.y}px, ${state.z}px) ` +
                  `rotateZ(${state.rotationZ}deg) rotateY(${state.rotationY}deg) ` +
                  `rotateX(${state.rotationX}deg) scale(${state.scale})`,
              }}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
};
