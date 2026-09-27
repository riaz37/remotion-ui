import { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { PULLBACK } from "./timeline";
import { COLORS, SANS } from "./theme";
import { CLAMP, settle } from "./lib/anim";
import { useHookMetrics } from "./camera/hook-metrics";
import { CUTS, blurWeight, createFilmCamera } from "./camera/shots";
import { MotionBlur, blurSigma } from "./camera/MotionBlur";
import { World } from "./world/World";
import { Cursor } from "./overlay/Cursor";
import { EndCard, impactShake } from "./overlay/EndCard";
import { Soundtrack } from "./audio/Soundtrack";

/**
 * SupabaseDemo — an unofficial 48 s product tour, one camera over one world.
 *
 * Layers, back to front: the world (panels, beam, labels) under the camera and
 * its motion blur; the cursor in screen space; a vignette; the pull-back
 * caption; the end card. See timeline.ts for the beat sheet.
 */

export const supabaseDemoSchema = z.object({
  /** Turn off to measure what the motion blur costs. */
  motionBlur: z.boolean(),
});

type Props = z.infer<typeof supabaseDemoSchema>;

const PlatformCaption: React.FC<{ frame: number }> = ({ frame }) => {
  const shown = settle(frame, PULLBACK.labelsIn + 12, 16);
  const out = interpolate(frame, [PULLBACK.labelsOut, PULLBACK.labelsOut + 10], [1, 0], CLAMP);
  if (shown <= 0 || out <= 0) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 52,
        textAlign: "center",
        fontFamily: SANS,
        fontSize: 34,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        color: COLORS.muted,
        opacity: shown * out,
        transform: `translateY(${(1 - shown) * 12}px)`,
      }}
    >
      Everything you just saw runs on <span style={{ color: COLORS.text }}>one Postgres database.</span>
    </div>
  );
};

export const SupabaseDemo: React.FC<Props> = ({ motionBlur }) => {
  const frame = useCurrentFrame();
  const metrics = useHookMetrics();
  const cameraAt = useMemo(() => (metrics ? createFilmCamera(metrics) : null), [metrics]);

  if (!metrics || !cameraAt) {
    return <AbsoluteFill style={{ background: COLORS.world }} />;
  }

  const camera = cameraAt(frame);
  const raw = motionBlur ? blurSigma(cameraAt, frame, CUTS) : { x: 0, y: 0 };
  const weight = blurWeight(frame);
  const sigma = { x: raw.x * weight, y: raw.y * weight };
  const shake = impactShake(frame);

  return (
    <AbsoluteFill style={{ background: COLORS.world, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}>
        <MotionBlur sigma={sigma}>
          <World frame={frame} camera={camera} metrics={metrics} />
        </MotionBlur>
        <Cursor frame={frame} camera={camera} />
        <AbsoluteFill
          style={{
            background: "radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)",
            pointerEvents: "none",
          }}
        />
        <PlatformCaption frame={frame} />
        <EndCard frame={frame} />
      </AbsoluteFill>
      <Soundtrack />
    </AbsoluteFill>
  );
};
