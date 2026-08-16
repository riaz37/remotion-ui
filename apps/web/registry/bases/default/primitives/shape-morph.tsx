import { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";
import {
  MORPH_SHAPES,
  type MorphShapeName,
  morphSequence,
  prepareMorphSequence,
} from "@/remotion/lib/path-morph";

export type ShapeMorphProps = {
  /**
   * The shapes to travel through, in order. Names come from `MORPH_SHAPES`;
   * anything else is treated as a raw `d` string, so a logo can sit in the
   * chain beside a preset.
   */
  shapes?: (MorphShapeName | string)[];
  /** Frames to wait before the morph starts. */
  delayInFrames?: number;
  /** Frames the whole chain takes, end to end. */
  durationInFrames?: number;
  /** Returns to the first shape, so a looping driver has no seam. */
  loop?: boolean;
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  /**
   * Degrees the shape turns across the whole chain. A little rotation stops a
   * symmetrical pair — square to diamond — from looking like a still image.
   */
  rotation?: number;
  /** Frame the shape starts leaving. Omit to leave it on screen. */
  exitAtInFrames?: number;
  /** Frames the exit takes. */
  exitInFrames?: number;
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const resolve = (shape: MorphShapeName | string) =>
  shape in MORPH_SHAPES ? MORPH_SHAPES[shape as MorphShapeName] : shape;

/**
 * One shape becoming another, and another, on a single progress ramp.
 *
 * The chain is prepared once and evaluated per frame. Preparation is the
 * expensive half — parsing, winding alignment, box fitting — and it depends on
 * nothing but the `d` strings, so doing it inside the render would re-parse
 * every path thirty times a second for strings that never change.
 *
 * Morph steps are linear inside the chain on purpose. Easing each hop
 * individually puts a stall at every shape, which reads as a slideshow; the
 * easing belongs on the ramp that drives the whole chain.
 */
export const ShapeMorph: React.FC<ShapeMorphProps> = ({
  shapes = ["circle", "squircle", "triangle", "diamond"],
  delayInFrames = 0,
  durationInFrames = 90,
  loop = false,
  size = 220,
  fill = "#E8B86D",
  stroke,
  strokeWidth = 3,
  rotation = 18,
  exitAtInFrames,
  exitInFrames = 16,
}) => {
  const frame = useCurrentFrame();

  const pairs = useMemo(
    () => prepareMorphSequence(shapes.map(resolve), { loop }),
    [shapes, loop],
  );

  const progress = interpolate(
    frame,
    [delayInFrames, delayInFrames + durationInFrames],
    [0, 1],
    { easing: EASING.editorial, ...clamp },
  );

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const d = pairs.length > 0 ? morphSequence(progress, pairs) : resolve(shapes[0] ?? "circle");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ overflow: "visible", opacity: 1 - exit }}
    >
      <g
        style={{
          transformOrigin: "50px 50px",
          transform: `rotate(${progress * rotation}deg) scale(${1 - exit * 0.12})`,
        }}
      >
        <path
          d={d}
          fill={fill ?? "none"}
          stroke={stroke}
          strokeWidth={stroke ? strokeWidth : undefined}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
