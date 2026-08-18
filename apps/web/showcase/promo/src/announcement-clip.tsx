import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionSlide } from "@/remotion/primitives/transition-slide";
import { EndCard } from "@/remotion/scenes/end-card";
import { FeatureList, type FeatureItem } from "@/remotion/scenes/feature-list";
import { HookCard } from "@/remotion/scenes/hook-card";
import {
  TerminalSimulator,
  type TerminalStep,
} from "@/remotion/scenes/terminal-simulator";

/**
 * announcement-clip — a 15-second landscape release announcement.
 *
 * Four beats in the order an announcement has to land: the news, the command
 * that acts on it, what the command gets you, and where to go. Every beat is an
 * existing registry scene; this file only schedules them and holds the palette
 * steady across the cuts so the pushes read as one clip rather than four
 * stitched slides.
 *
 * Timeline (450 frames @ 30fps, transitions overlapping):
 *   hook 0-95 · install 80-265 · catalog 250-363 · end card 348-449
 *
 * Duration math: (96 + 186 + 114 + 102) - 3 x 16 = 450.
 *
 * Every scene here holds rather than exits — correct inside a
 * `TransitionSeries`, where the push covers the tail. Each one keeps
 * something alive under its last frames (the hook's drifting bloom, the
 * terminal's caret, the end card's pulse) so no beat parks on a dead image.
 */

/** One palette across the four beats — the cuts are colour continuous. */
const COLORS = {
  stage: "#050505",
  hookBg: "#0A0908",
  terminalBg: "#07070B",
  listBg: "#0A0908",
  endBg: "#0D0C0B",
  accent: "#E8B86D",
} as const;

const SCENE_DURATIONS = {
  hook: 96,
  install: 186,
  catalog: 114,
  end: 102,
} as const;

/** Overlap consumed by each cut. Kept in one place so the total cannot drift. */
const TRANSITION_FRAMES = 16;

export const ANNOUNCEMENT_CLIP_DURATION =
  SCENE_DURATIONS.hook +
  SCENE_DURATIONS.install +
  SCENE_DURATIONS.catalog +
  SCENE_DURATIONS.end -
  3 * TRANSITION_FRAMES;

/**
 * The beats push rather than blend. All four are full-frame centred layouts, so
 * a crossfade lays a headline over a terminal window for the whole overlap and
 * reads as a double exposure, while a dip to black blanks the frame for eight
 * of its twelve frames. A push keeps exactly one beat on screen and gives the
 * clip a single direction of travel: every beat arrives from below and leaves
 * upward.
 */
const CUT = transitionSlide({
  durationInFrames: TRANSITION_FRAMES,
  direction: "from-bottom",
});

/**
 * The catalog beat is slowed slightly so its last row finishes ticking just
 * before the cut. At full speed the list settles a second early and the beat
 * ends on a still frame.
 */
const CATALOG_SPEED = 0.85;

/**
 * Likewise the end card: at full speed its attention pulse is over well before
 * the clip is, leaving a frozen tail on the most-screenshotted frame.
 */
const END_SPEED = 0.9;

const DEFAULT_STEPS: TerminalStep[] = [
  { text: "resolving @remotionui/social-clip" },
  { text: "fetching 22 registry items", work: 0.6 },
  { text: "writing 22 files to src/" },
];

const DEFAULT_ITEMS: FeatureItem[] = [
  { label: "Primitives & text effects", detail: "51" },
  { label: "Scenes & UI blocks", detail: "53" },
  { label: "Captions, charts & media", detail: "38" },
  { label: "Transitions, paths & device", detail: "37" },
  { label: "Full compositions", detail: "21" },
];

export type AnnouncementClipProps = {
  /** The news, delivered in one line. */
  headline?: string;
  /** Substring of `headline` that takes the accent and the underline. */
  emphasis?: string;
  /** Small live label above the hook. */
  kicker?: string;
  /** Supporting line under the hook. */
  subtitle?: string;
  /** Command typed in the install beat. */
  command?: string;
  /** Steps the command resolves through. */
  steps?: TerminalStep[];
  /** Dim line printed after the last step. */
  terminalSummary?: string;
  /** Working directory shown at the prompt. */
  prompt?: string;
  /** Label above the catalog list. */
  catalogEyebrow?: string;
  /** Heading over the catalog list. */
  catalogTitle?: string;
  /** Catalog rows. Beyond five are dropped by `FeatureList`. */
  items?: FeatureItem[];
  /** Chip above the end-card title. */
  ctaEyebrow?: string;
  ctaTitle?: string;
  ctaSubtitle?: string;
  /** End-card button label. */
  ctaLabel?: string;
  /** Address typed under the button. */
  ctaUrl?: string;
  /** Channels listed along the foot of the end card. */
  handles?: string[];
  accentColor?: string;
};

export const AnnouncementClip: React.FC<AnnouncementClipProps> = ({
  headline = "RemotionUI is now in the shadcn registry",
  emphasis = "shadcn registry",
  kicker = "Now listed",
  subtitle = "Search @remotionui in the official shadcn registry directory.",
  command = "npx shadcn@latest add @remotionui/social-clip",
  steps = DEFAULT_STEPS,
  terminalSummary = "Source in your repo. Every frame is yours to edit.",
  prompt = "~/my-video",
  catalogEyebrow = "200 components",
  catalogTitle = "One namespace, the whole catalog",
  items = DEFAULT_ITEMS,
  ctaEyebrow = "Available now",
  ctaTitle = "Install from the shadcn registry",
  ctaSubtitle = "Copy-paste motion components for Remotion.",
  ctaLabel = "Browse the catalog",
  ctaUrl = "remotionui.com",
  handles = ["@remotionui", "remotion-ui@0.9.0", "github.com/riaz37/remotion-ui"],
  accentColor = COLORS.accent,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.stage }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.hook}>
          <HookCard
            headline={headline}
            emphasis={emphasis}
            kicker={kicker}
            subtitle={subtitle}
            align="left"
            accentColor={accentColor}
            backgroundColor={COLORS.hookBg}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...CUT} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.install}>
          <TerminalSimulator
            command={command}
            steps={steps}
            summary={terminalSummary}
            prompt={prompt}
            title="shadcn"
            shell="zsh"
            accentColor={accentColor}
            backgroundColor={COLORS.terminalBg}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...CUT} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.catalog}>
          <FeatureList
            eyebrow={catalogEyebrow}
            title={catalogTitle}
            items={items}
            accentColor={accentColor}
            backgroundColor={COLORS.listBg}
            speed={CATALOG_SPEED}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...CUT} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.end}>
          <EndCard
            eyebrow={ctaEyebrow}
            title={ctaTitle}
            subtitle={ctaSubtitle}
            cta={ctaLabel}
            url={ctaUrl}
            handles={handles}
            accentColor={accentColor}
            backgroundColor={COLORS.endBg}
            speed={END_SPEED}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
