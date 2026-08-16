import { chromaticAberration } from "@remotion/effects/chromatic-aberration";
import { scanlines } from "@remotion/effects/scanlines";
import {
  AbsoluteFill,
  HtmlInCanvas,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LightSweepText } from "@/remotion/primitives/light-sweep-text";
import { lensWarp } from "./lens-warp";

/**
 * Tier 2 — takes an existing DOM primitive of ours and runs its pixels through
 * a shader stack. Preview needs Chrome 149 + chrome://flags/#canvas-draw-element;
 * rendering works unmodified because Remotion ships Chrome with the flag on.
 */
export const GlassHeadline: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const split = interpolate(frame, [0, 20, 45], [26, 4, 1.5], {
    extrapolateRight: "clamp",
  });

  return (
    <HtmlInCanvas
      width={width}
      height={height}
      effects={[
        // Our own warp rather than barrelDistortion(), which blackens any
        // sample that falls outside the texture and so rings the frame with a
        // dark rounded border. lensWarp fits the warp inside the texture, which
        // leaves the amount free to be a strength the eye can actually read.
        lensWarp({ amount: 0.1 }),
        chromaticAberration({ amount: split, angle: 8 }),
        scanlines({ amount: 0.08, spacing: 3, offset: frame * 0.5 }),
      ]}
    >
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#08080c",
        }}
      >
        <LightSweepText text="Rendered on the GPU" fontSize={132} />
      </AbsoluteFill>
    </HtmlInCanvas>
  );
};
