import { useLayoutEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import {
  applyEffectors,
  cloneOutline,
  layoutClones,
  projectClone,
  type Camera,
  type CloneShape,
  type CloneState,
  type ClonerLayout,
  type Effector,
} from "@/remotion/lib/mograph";

export type {
  ClonerLayout,
  CloneShape,
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
  /**
   * `dom` renders each clone as an element, so any React child can be cloned.
   * `canvas` draws `cloneShape` with the same camera maths on one canvas — use
   * it for thousands of clones. `children` and `renderClone` are DOM-only.
   */
  renderer?: "dom" | "canvas";
  /** Canvas renderer only: the drawn shape. */
  cloneShape?: CloneShape;
  /** Canvas renderer only: bloom radius in px at full field weight. 0 is off. */
  glow?: number;
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
  renderer = "dom",
  cloneShape = "rounded",
  glow = 0,
  frame: frameOverride,
  style,
  className,
}) => {
  if (renderer === "canvas" && (children !== undefined || renderClone !== undefined)) {
    throw new Error(
      "EffectorField: children and renderClone need renderer=\"dom\"; the canvas renderer draws cloneShape.",
    );
  }
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frame = frameOverride ?? currentFrame;

  const clones = useMemo(() => layoutClones(layout), [layout]);
  const states = useMemo(
    () => applyEffectors(clones, effectors, { frame, fps }),
    [clones, effectors, frame, fps],
  );

  const half = cloneSize / 2;

  if (renderer === "canvas") {
    return (
      <CanvasClones
        states={states}
        camera={{ width, height, perspective, tilt }}
        cloneSize={cloneSize}
        cloneShape={cloneShape}
        color={color}
        glow={glow}
        style={style}
        className={className}
      />
    );
  }

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

/**
 * The canvas path: every clone's outline is projected with the same camera the
 * DOM path gets from CSS 3D (`projectClone`), sorted back to front and filled.
 * Drawn in a layout effect, so the frame is complete before it is captured,
 * and at device-pixel resolution, so a `--scale 2` render stays sharp.
 */
const CanvasClones: React.FC<{
  states: CloneState[];
  camera: Camera;
  cloneSize: number;
  cloneShape: CloneShape;
  color: string;
  glow: number;
  style?: CSSProperties;
  className?: string;
}> = ({ states, camera, cloneSize, cloneShape, color, glow, style, className }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const outline = useMemo(() => cloneOutline(cloneShape, cloneSize), [cloneShape, cloneSize]);

  useLayoutEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    canvas.width = Math.round(camera.width * dpr);
    canvas.height = Math.round(camera.height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, camera.width, camera.height);

    const drawn = states
      .filter((state) => state.opacity > 0.002)
      .map((state) => ({ state, ...projectClone(state, outline, camera) }))
      .sort((a, b) => a.depth - b.depth);

    const fills = drawn.map(({ state }) => tint(color, state.tints));
    const trace = (target: CanvasRenderingContext2D, points: Array<[number, number]>) => {
      target.beginPath();
      points.forEach(([x, y], i) => (i === 0 ? target.moveTo(x, y) : target.lineTo(x, y)));
      target.closePath();
      target.fill();
    };

    // Bloom: one blur per frame, not one per clone. Per-clone `shadowBlur`
    // cost ~85% of a 5,000-clone frame. Glowing clones are drawn at half
    // resolution, weighted by their field value, blurred once, and added in
    // beneath the crisp pass.
    if (glow > 0) {
      const bloom = document.createElement("canvas");
      const k = 0.5;
      bloom.width = Math.max(1, Math.round(camera.width * k));
      bloom.height = Math.max(1, Math.round(camera.height * k));
      const b = bloom.getContext("2d");
      if (b) {
        b.setTransform(k, 0, 0, k, 0, 0);
        drawn.forEach(({ state, points }, i) => {
          if (state.weight <= 0.05) return;
          b.globalAlpha = Math.min(1, state.weight * state.opacity);
          b.fillStyle = fills[i];
          trace(b, points);
        });
        context.save();
        context.globalCompositeOperation = "lighter";
        context.filter = `blur(${glow}px)`;
        context.drawImage(bloom, 0, 0, camera.width, camera.height);
        context.restore();
      }
    }

    drawn.forEach(({ state, points }, i) => {
      context.globalAlpha = Math.min(1, state.opacity);
      context.fillStyle = fills[i];
      trace(context, points);
    });
    context.globalAlpha = 1;
  }, [states, outline, camera.width, camera.height, camera.perspective, camera.tilt, color, glow]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ width: camera.width, height: camera.height, display: "block", ...style }}
    />
  );
};
