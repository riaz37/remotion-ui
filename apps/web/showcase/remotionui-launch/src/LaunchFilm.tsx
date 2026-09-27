import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AnimatedNoiseGrain } from "@/remotion/primitives/animated-noise-grain";
import { END, REVEAL } from "./timeline";
import { COLORS } from "./theme";
import { CLAMP, ease } from "./lib/anim";
import { CUTS, blurWeight, cameraAt, worldReveal } from "./camera/shots";
import { MotionBlur, blurSigma } from "./camera/MotionBlur";
import { worldTransform, type Camera } from "./camera/rig";
import { DocsScreen, HeroScreen, TerminalScreen } from "./world/Screens";
import { Fan } from "./world/Fan";
import { MontageCard } from "./world/MontageCard";
import { Wall } from "./world/Wall";
import { Thesis } from "./overlay/Thesis";
import { Reveal } from "./overlay/Reveal";
import { EndCard, impactShake } from "./overlay/EndCard";
import { Soundtrack } from "./audio/Soundtrack";

/**
 * RemotionUILaunch: the 34 s launch film. Timing lives in timeline.ts.
 *
 * Back to front: the dot-grid world backdrop; the world (captures, terminal,
 * file fan, wall, montage card) under one camera with analytic motion blur;
 * the thesis type, reveal and end card in screen space; a grain pass on top.
 */

export const launchFilmSchema = z.object({
  /** Turn off to measure what the motion blur costs. */
  motionBlur: z.boolean(),
});

type Props = z.infer<typeof launchFilmSchema>;

/** Static dot grid, drifting with the camera at a fraction of its speed for parallax. */
const Backdrop: React.FC<{ camera: Camera }> = ({ camera }) => {
  const spacing = 34;
  const ox = -(camera.x * 0.06) % spacing;
  const oy = -(camera.y * 0.06) % spacing;
  return (
    <AbsoluteFill style={{ background: COLORS.stage }}>
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(circle, rgba(236,236,236,0.085) 1.2px, transparent 1.6px)",
          backgroundSize: `${spacing}px ${spacing}px`,
          backgroundPosition: `${ox.toFixed(2)}px ${oy.toFixed(2)}px`,
          maskImage: "radial-gradient(ellipse 80% 75% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 75% at 50% 50%, black 30%, transparent 100%)",
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 50% at 50% 45%, rgba(${COLORS.phosphorRgb},0.045), transparent 70%)` }} />
    </AbsoluteFill>
  );
};

const World: React.FC<{ frame: number; camera: Camera }> = ({ frame, camera }) => (
  <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: worldTransform(camera) }}>
    <HeroScreen frame={frame} />
    <DocsScreen frame={frame} />
    <TerminalScreen frame={frame} />
    <Fan frame={frame} />
    <Wall frame={frame} />
    <MontageCard frame={frame} />
  </div>
);

export const RemotionUILaunch: React.FC<Props> = ({ motionBlur }) => {
  const frame = useCurrentFrame();
  const camera = cameraAt(frame);
  const raw = motionBlur ? blurSigma(cameraAt, frame, CUTS) : { x: 0, y: 0 };
  const weight = blurWeight(frame);
  const sigma = { x: raw.x * weight, y: raw.y * weight };
  const shake = impactShake(frame);

  // The wall tilts back as the camera pulls out, and falls out of focus when
  // the gallery page takes the foreground.
  const tilt = interpolate(frame, [REVEAL.pullStart, REVEAL.pullEnd], [0, 1], { ...CLAMP, easing: ease.inOut });
  const focusPull = interpolate(frame, [REVEAL.galleryStart, REVEAL.galleryEnd], [0, 1], CLAMP);
  const worldOpacity = worldReveal(frame) * interpolate(frame, [END.impact - 6, END.impact], [1, 0], CLAMP);

  return (
    <AbsoluteFill style={{ background: COLORS.stage, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}>
        <Backdrop camera={camera} />
        {worldOpacity > 0 ? (
          <AbsoluteFill
            style={{
              opacity: worldOpacity,
              transform: tilt > 0 ? `perspective(2200px) rotateX(${(tilt * 16).toFixed(3)}deg) rotateZ(${(-tilt * 2).toFixed(3)}deg)` : undefined,
              filter: focusPull > 0.01 ? `blur(${(focusPull * 9).toFixed(2)}px) brightness(${(1 - focusPull * 0.5).toFixed(3)})` : undefined,
            }}
          >
            <MotionBlur sigma={sigma}>
              <World frame={frame} camera={camera} />
            </MotionBlur>
          </AbsoluteFill>
        ) : null}
        <AbsoluteFill
          style={{ background: "radial-gradient(ellipse 78% 72% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)", pointerEvents: "none" }}
        />
        <Thesis frame={frame} />
        <Reveal frame={frame} />
        <EndCard frame={frame} />
      </AbsoluteFill>
      <AnimatedNoiseGrain opacity={0.07} vignette={0.2} seed={3} />
      <Soundtrack />
    </AbsoluteFill>
  );
};
