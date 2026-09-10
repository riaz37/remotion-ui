import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionCircleReveal } from "@/remotion/primitives/transition-circle-reveal";
import { transitionSlide } from "@/remotion/primitives/transition-slide";
import { transitionWipe } from "@/remotion/primitives/transition-wipe";
import { CommitGraph, type GraphCommit } from "@/remotion/scenes/commit-graph";
import { EndCard } from "@/remotion/scenes/end-card";
import { RemotionUIMark } from "./remotionui-mark";
import { StarReveal } from "./star-reveal";

/**
 * stars-celebration — a landscape announcement for hitting 50 GitHub stars.
 *
 * Four beats, each speaking the same terminal/git-native visual language as
 * the rest of the brand instead of generic corporate stat-card motion
 * graphics: the real logo mark, a `gh api` read-back of the star count with
 * the actual GitHub star shape (not just a number) plus a live `tail -f
 * stargazers.log` ticker of real stargazer avatars next to it, a git log
 * building up to the milestone commit, and the CTA. `RemotionUIMark` and
 * `StarReveal` (and the `StargazerFeed` panel it renders) are custom to this
 * clip (not registry scenes — nobody installs a "GitHub star count for
 * RemotionUI" component); `CommitGraph` and `EndCard` are existing registry
 * scenes reused as-is.
 *
 * Timeline (270 frames @ 30fps, transitions overlapping):
 *   mark 0-65 · stars 52-173 · commits 156-221 · end 210-269
 *
 * Duration math: (66 + 122 + 66 + 60) - (14 + 18 + 12) = 270.
 *
 * The star-count beat's extra length over the mark/commits beats is spent on
 * the stargazer ticker's scroll pass (frames 40-114 scene-local), not on a
 * static hold — real social proof instead of an abstract number sitting on
 * screen doing nothing.
 *
 * The cuts vary on purpose — a wipe, then a circle reveal, then a push —
 * rather than the same slide three times in a row. Each scene's own motion
 * (mark + wordmark settling, star drawing and count landing, commits
 * building, the CTA's pulse) finishes with room to spare before its transition
 * starts, so no beat is caught mid-motion by the cut; `EndCard` is sped up via
 * its `speed` prop to fit that pattern inside its shorter window.
 */

const COLORS = {
  stage: "#050505",
  markBg: "#080810",
  starsBg: "#07070B",
  commitsBg: "#07070B",
  endBg: "#0D0C0B",
  accent: "#E8B86D",
} as const;

const SCENE_DURATIONS = {
  mark: 66,
  stars: 122,
  commits: 66,
  end: 60,
} as const;

/** Overlap consumed by each cut — deliberately different per cut, see below. */
const TRANSITION_FRAMES = {
  markToStars: 14,
  starsToCommits: 18,
  commitsToEnd: 12,
} as const;

export const STARS_CELEBRATION_DURATION =
  SCENE_DURATIONS.mark +
  SCENE_DURATIONS.stars +
  SCENE_DURATIONS.commits +
  SCENE_DURATIONS.end -
  (TRANSITION_FRAMES.markToStars +
    TRANSITION_FRAMES.starsToCommits +
    TRANSITION_FRAMES.commitsToEnd);

/**
 * A curtain wipe off the brand mark — reads as "cut to the next thing" rather
 * than the mark sliding away under its own weight.
 */
const CUT_MARK_TO_STARS = transitionWipe({
  durationInFrames: TRANSITION_FRAMES.markToStars,
  direction: "from-left",
});

/**
 * The star count opens onto the commit history from its own centre — a
 * reveal rather than a push, so the milestone feels like it is expanding into
 * the story behind it.
 */
const CUT_STARS_TO_COMMITS = transitionCircleReveal({
  durationInFrames: TRANSITION_FRAMES.starsToCommits,
  originX: 0.5,
  originY: 0.42,
});

/**
 * Back to a push for the last cut into the CTA — see `announcement-clip.tsx`
 * for why a push reads better than a crossfade across full-frame, centred
 * layouts.
 */
const CUT_COMMITS_TO_END = transitionSlide({
  durationInFrames: TRANSITION_FRAMES.commitsToEnd,
  direction: "from-bottom",
});

const DEFAULT_COMMITS: GraphCommit[] = [
  { message: "Ship the first primitives", hash: "a1b2c3d" },
  { message: "Cross 40 registry scenes", hash: "e4f5061" },
  { message: "Launch remotionui.com", hash: "72c9ad3" },
  { message: "Hit 50 GitHub stars", hash: "50fdbde", ref: "thank you" },
];

/**
 * `EndCard`'s attention pulse finishes at 2.75s of its own internal clock.
 * Sped up, that beat is reached at 2.75 x 30 / 1.41 ≈ 58.5 frames — inside
 * the 60-frame window, so the pulse completes rather than freezing mid-ring
 * when the clip ends.
 */
const END_SPEED = 1.41;

export type StarsCelebrationProps = {
  wordmark?: string;
  starCount?: number;
  starsLabel?: string;
  starsCaption?: string;
  starsCommand?: string;
  commits?: GraphCommit[];
  ctaEyebrow?: string;
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  accentColor?: string;
};

export const StarsCelebration: React.FC<StarsCelebrationProps> = ({
  wordmark = "RemotionUI",
  starCount = 50,
  starsLabel = "GitHub Stars",
  starsCaption = "and counting",
  starsCommand = "gh api repos/riaz37/remotion-ui --jq .stargazers_count",
  commits = DEFAULT_COMMITS,
  ctaEyebrow = "50 GitHub Stars",
  ctaTitle = "Star RemotionUI on GitHub",
  ctaSubtitle = "Copy-paste motion components for Remotion.",
  ctaLabel = "Star on GitHub",
  ctaUrl = "github.com/riaz37/remotion-ui",
  accentColor = COLORS.accent,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.stage }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.mark}>
          <RemotionUIMark
            wordmark={wordmark}
            accentColor={accentColor}
            backgroundColor={COLORS.markBg}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...CUT_MARK_TO_STARS} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.stars}>
          <StarReveal
            command={starsCommand}
            starCount={starCount}
            label={starsLabel}
            caption={starsCaption}
            accentColor={accentColor}
            backgroundColor={COLORS.starsBg}
            durationInFrames={SCENE_DURATIONS.stars}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...CUT_STARS_TO_COMMITS} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.commits}>
          <CommitGraph
            commits={commits}
            windowTitle="git log --oneline --graph"
            startAtSeconds={0.28}
            stepSeconds={0.32}
            accentColor={accentColor}
            backgroundColor={COLORS.commitsBg}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...CUT_COMMITS_TO_END} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.end}>
          <EndCard
            eyebrow={ctaEyebrow}
            title={ctaTitle}
            subtitle={ctaSubtitle}
            cta={ctaLabel}
            url={ctaUrl}
            accentColor={accentColor}
            backgroundColor={COLORS.endBg}
            speed={END_SPEED}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
