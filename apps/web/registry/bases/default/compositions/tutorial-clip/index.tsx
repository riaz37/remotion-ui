import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { AutoFitTitle } from "@/remotion/scenes/auto-fit-title";
import { CalloutSpotlight, type SpotlightTarget } from "@/remotion/scenes/callout-spotlight";
import { CodeReveal } from "@/remotion/scenes/code-reveal";
import { EndCard } from "@/remotion/scenes/end-card";
import { MediaFrame } from "@/remotion/scenes/media-frame";

export type TutorialClipProps = {
  title?: string;
  subtitle?: string;
  mediaSrc: string;
  calloutTitle?: string;
  calloutSubtitle?: string;
  calloutTarget?: SpotlightTarget;
  code?: string;
  ctaTitle?: string;
  ctaLabel?: string;
};

const fade = transitionFade({ durationInFrames: 12 });

export const TutorialClip: React.FC<TutorialClipProps> = ({
  title = "Show the workflow",
  subtitle = "Turn a demo into a polished clip",
  mediaSrc,
  calloutTitle = "Highlight the key action",
  calloutSubtitle = "Guide attention without crowding the frame.",
  calloutTarget = { x: 520, y: 260, width: 520, height: 300 },
  code = `npx remotion-ui add media-frame\nnpx remotion-ui add callout-spotlight\nnpx remotion-ui add code-reveal`,
  ctaTitle = "Tutorial Cut",
  ctaLabel = "Ship video components faster",
}) => (
  <AbsoluteFill style={{ backgroundColor: "#020617" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={60}>
        <AutoFitTitle title={title} subtitle={subtitle} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={90}>
        <MediaFrame src={mediaSrc} title="Product walkthrough" caption="Use your screenshot, product clip, or recording." />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={80}>
        <CalloutSpotlight
          title={calloutTitle}
          subtitle={calloutSubtitle}
          backgroundSrc={mediaSrc}
          target={calloutTarget}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={80}>
        <CodeReveal code={code} highlightedLines={[2]} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={60}>
        <EndCard title={ctaTitle} cta={ctaLabel} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
