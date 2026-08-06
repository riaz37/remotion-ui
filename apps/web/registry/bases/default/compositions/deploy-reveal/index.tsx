import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { DURATION } from "@/remotion/lib/motion-tokens";
import { TerminalSimulator } from "@/remotion/scenes/terminal-simulator";
import { DeviceMockupZoom } from "@/remotion/scenes/device-mockup-zoom";

const SCENE_DURATIONS = {
  terminal: 90,
  device: 90,
} as const;

const FADE = transitionFade({ durationInFrames: DURATION.fast });

export const DeployReveal: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#080810" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.terminal}>
          {/* 90 frames — sped up so the prompt returns before the transition. */}
          <TerminalSimulator
            title="Deploy"
            command="vercel deploy --prod"
            steps={[
              { text: "uploading build output", duration: "1.2s" },
              { text: "assigning production domain", duration: "340ms" },
            ]}
            summary="live in 4.2s"
            speed={1.7}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.device}>
          <DeviceMockupZoom device="laptop" />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
