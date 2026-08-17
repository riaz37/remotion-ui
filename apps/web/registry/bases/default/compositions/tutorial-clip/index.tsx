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

/**
 * Total = sum(scenes) − sum(transitions) = 296 − 4 × 12 = 248, which is what
 * `lib/preview-config.ts` and the MDX page carry. Two beats moved without
 * changing that total:
 *
 * - The hook is 52, not 48: its crossfade used to sit exactly on the 15% audit
 *   sample, so every still of this composition caught the hook and the media
 *   scene half-dissolved into each other.
 * - The end card is 60, not 48. It is the payoff beat and it types an address;
 *   at 48 frames the last sample landed four frames into the typing and showed
 *   a single letter under the button. The 8 frames came off the media beat,
 *   which is settled by frame 31 either way.
 */
const SCENE = {
  hook: 52,
  media: 56,
  callout: 64,
  code: 64,
  end: 60,
} as const;

export type TutorialClipProps = {
  title?: string;
  subtitle?: string;
  mediaSrc?: string;
  /** Pixel size `calloutTarget` was measured against. Defaults to 1280x720. */
  mediaWidth?: number;
  mediaHeight?: number;
  /** Headline over the media beat. */
  mediaTitle?: string;
  /** Line under the media beat. */
  mediaCaption?: string;
  calloutTitle?: string;
  calloutSubtitle?: string;
  calloutTarget?: SpotlightTarget;
  code?: string;
  ctaTitle?: string;
  /** Line under the CTA title. */
  ctaSubtitle?: string;
  ctaLabel?: string;
  /** Address under the CTA button. Without it the end card is one line of text. */
  ctaUrl?: string;
};

const fade = transitionFade({ durationInFrames: DURATION.fast });

export const TutorialClip: React.FC<TutorialClipProps> = ({
  title = "Walkthrough clip",
  subtitle = "Demo the flow, spotlight the action, show the command",
  mediaSrc = SAMPLE_STILL_SRC,
  mediaWidth = 1280,
  mediaHeight = 720,
  mediaTitle = "The screen we are shipping",
  mediaCaption = "One tap queues the render",
  calloutTitle = "Tap Render to queue the job",
  calloutSubtitle = "Renders in 4.2s on the free tier.",
  calloutTarget = { x: 470, y: 280, width: 340, height: 200 },
  code = `npx remotion-ui add media-frame\nnpx remotion-ui add callout-spotlight\nnpx remotion-ui add code-reveal`,
  ctaTitle,
  ctaSubtitle,
  ctaLabel,
  ctaUrl,
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
          title={mediaTitle}
          caption={mediaCaption}
          // Cut the frame to the source's own aspect, so a portrait capture
          // fills it instead of sitting small inside a 16:9 letterbox.
          aspect={mediaWidth / mediaHeight}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={SCENE.callout}>
        <CalloutSpotlight
          // The whole aim-and-callout beat has to fit a 64-frame window, and
          // the subtitle is the last thing to land — at 1.7 it had not started
          // by the audit's hold sample, so the card showed a title over an
          // empty half.
          speed={2}
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
          speed={2.3}
          title={ctaTitle ?? title}
          subtitle={ctaSubtitle}
          cta={ctaLabel}
          url={ctaUrl}
          backgroundColor={COLORS.endBg}
          accentColor={COLORS.endAccent}
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
