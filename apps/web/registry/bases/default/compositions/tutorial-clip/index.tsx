import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { DURATION } from "@/remotion/lib/motion-tokens";
import { AutoFitTitle } from "@/remotion/scenes/auto-fit-title";
import { CalloutSpotlight, type SpotlightTarget } from "@/remotion/scenes/callout-spotlight";
import { CodeReveal } from "@/remotion/scenes/code-reveal";
import { EndCard } from "@/remotion/scenes/end-card";
import { MediaFrame } from "@/remotion/scenes/media-frame";
import { SAMPLE_STILL_SRC } from "@/remotion/lib/sample-media";

const COLORS = {
  bg: "#041016",
  hookBg: "#041016",
  hookAccent: "#22d3ee",
  mediaBg: "#071018",
  calloutBg: "#0a1520",
  codeBg: "#020617",
  endBg: "#041016",
  endAccent: "#22d3ee",
} as const;

const SCENE = {
  hook: 48,
  media: 72,
  callout: 64,
  code: 64,
  end: 48,
} as const;

export type TutorialClipProps = {
  title?: string;
  subtitle?: string;
  mediaSrc?: string;
  /** Pixel size `calloutTarget` was measured against. Defaults to 1280x720. */
  mediaWidth?: number;
  mediaHeight?: number;
  calloutTitle?: string;
  calloutSubtitle?: string;
  calloutTarget?: SpotlightTarget;
  code?: string;
  ctaTitle?: string;
  ctaLabel?: string;
};

const fade = transitionFade({ durationInFrames: DURATION.fast });

export const TutorialClip: React.FC<TutorialClipProps> = ({
  title = "Walkthrough clip",
  subtitle = "Demo the flow, spotlight the action, show the command",
  mediaSrc = SAMPLE_STILL_SRC,
  mediaWidth = 1280,
  mediaHeight = 720,
  calloutTitle = "Spotlight the control",
  calloutSubtitle = "One callout keeps the frame readable.",
  calloutTarget = { x: 470, y: 280, width: 340, height: 200 },
  code = `npx remotion-ui add media-frame\nnpx remotion-ui add callout-spotlight\nnpx remotion-ui add code-reveal`,
  ctaTitle,
  ctaLabel,
}) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENE.hook}>
        <AutoFitTitle
          title={title}
          subtitle={subtitle}
          accentColor={COLORS.hookAccent}
          backgroundColor={COLORS.hookBg}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={SCENE.media}>
        <MediaFrame
          src={mediaSrc}
          title="Screen recording"
          caption="Swap in your screenshot, Loom, or product capture."
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={SCENE.callout}>
        <CalloutSpotlight
          // The whole aim-and-callout beat has to fit a 64-frame window.
          speed={1.7}
          title={calloutTitle}
          subtitle={calloutSubtitle}
          backgroundSrc={mediaSrc}
          target={calloutTarget}
          sourceWidth={mediaWidth}
          sourceHeight={mediaHeight}
          backgroundColor={COLORS.calloutBg}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={SCENE.code}>
        <CodeReveal
          code={code}
          highlightedLines={[3]}
          title="install.sh"
          language="bash"
          backgroundColor={COLORS.codeBg}
          accentColor={COLORS.hookAccent}
          speed={1.6}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={SCENE.end}>
        <EndCard
          speed={1.4}
          title={ctaTitle ?? title}
          cta={ctaLabel}
          backgroundColor={COLORS.endBg}
          accentColor={COLORS.endAccent}
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
