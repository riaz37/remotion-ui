import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionCircleReveal } from "@/remotion/primitives/transition-circle-reveal";
import { transitionSlide } from "@/remotion/primitives/transition-slide";
import { transitionWipe } from "@/remotion/primitives/transition-wipe";
import { DeviceMockupZoom } from "@/remotion/scenes/device-mockup-zoom";
import { EndCard } from "@/remotion/scenes/end-card";
import {
  FileTreeReveal,
  type FileNode,
} from "@/remotion/scenes/file-tree-reveal";
import {
  TerminalSimulator,
  type TerminalStep,
} from "@/remotion/scenes/terminal-simulator";
import { InstalledPreview } from "./installed-preview";
import { RegistryDirectoryCard } from "./registry-directory-card";

/**
 * registry-listing-clip — an 18-second landscape promo proving one thing:
 * RemotionUI is discoverable through the shadcn registry ecosystem and one
 * command away from a real repo. "Found it in the shadcn registry, one
 * command, it's yours."
 *
 * Five beats, each an existing registry scene except the two that have no
 * registry equivalent (`RegistryDirectoryCard` — a registry.directory listing
 * mockup, nobody installs that as a reusable scene — and `InstalledPreview` —
 * the nested "it's actually playing" nested content, written to fill its
 * parent's box rather than the full composition, see that file for why it
 * can't just be `StatCard` dropped in unscaled):
 *
 *   1. terminal   — `npx shadcn@latest add @remotionui/social-clip` runs
 *   2. directory  — registry.directory surfaces the RemotionUI listing
 *   3. file tree  — the installed file lands in the repo as plain .tsx
 *   4. device     — the installed component actually playing, in a browser
 *   5. end card   — "200 components. Your repo." + remotionui.com
 *
 * Timeline (540 frames @ 30fps, transitions overlapping):
 *   terminal 0-174 · directory 159-257 · tree 242-351 · device 336-455 · end 440-539
 *
 * Duration math: (175 + 99 + 110 + 120 + 100) - 4 x 16 = 540.
 *
 * The terminal's own content (type, submit, three steps, summary, prompt
 * return) resolves at ~152 frames of its own 175 — the 23-frame margin is
 * deliberate so the prompt-return beat, the real "done" signal, is not
 * chopped by the cut (a `TerminalSimulator` with `holdSeconds` unset holds
 * past that anyway, but the cut still has to land after the beat finishes
 * playing, not mid-flight).
 *
 * All five beats are full-frame, centred layouts, so — per the reasoning in
 * `announcement-clip.tsx` — the cuts push or wipe rather than crossfade; two
 * centred cards crossfading is a double exposure, not a transition. The cut
 * shapes still vary (wipe, circle reveal, slide, wipe) rather than repeating
 * one shape four times, the way `stars-celebration.tsx` varies its three.
 */

const COLORS = {
  stage: "#050505",
  terminalBg: "#07070B",
  directoryBg: "#07070B",
  treeBg: "#08080D",
  deviceBg: "#080810",
  endBg: "#0D0C0B",
  accent: "#E8B86D",
} as const;

const SCENE_DURATIONS = {
  terminal: 175,
  directory: 99,
  tree: 110,
  device: 120,
  end: 100,
} as const;

const TRANSITION_FRAMES = 16;

export const REGISTRY_LISTING_CLIP_DURATION =
  SCENE_DURATIONS.terminal +
  SCENE_DURATIONS.directory +
  SCENE_DURATIONS.tree +
  SCENE_DURATIONS.device +
  SCENE_DURATIONS.end -
  4 * TRANSITION_FRAMES;

/** Terminal to directory: a curtain wipe, the same shape `stars-celebration`
 * uses to leave its own terminal-register beat. */
const CUT_TERMINAL_TO_DIRECTORY = transitionWipe({
  durationInFrames: TRANSITION_FRAMES,
  direction: "from-left",
});

/** Directory to file tree: opens from the listing card's own centre, so the
 * install feels like it expands out of the thing that was just found. */
const CUT_DIRECTORY_TO_TREE = transitionCircleReveal({
  durationInFrames: TRANSITION_FRAMES,
  originX: 0.5,
  originY: 0.58,
});

/** File tree to device: a push, arriving from below — "and here's what that
 * file does" landing on top of the repo view. */
const CUT_TREE_TO_DEVICE = transitionSlide({
  durationInFrames: TRANSITION_FRAMES,
  direction: "from-bottom",
});

/** Device to end card: back to a wipe, closing the loop with beat one's
 * shape instead of a fourth new one. */
const CUT_DEVICE_TO_END = transitionWipe({
  durationInFrames: TRANSITION_FRAMES,
  direction: "from-right",
});

const DEFAULT_STEPS: TerminalStep[] = [
  { text: "resolving @remotionui/social-clip" },
  { text: "fetching from registry.directory", work: 0.5 },
  { text: "writing 14 files to src/" },
];

const DEFAULT_NODES: FileNode[] = [
  {
    name: "src",
    children: [
      {
        name: "remotion",
        children: [
          {
            name: "compositions",
            children: [{ name: "social-clip.tsx" }],
          },
        ],
      },
    ],
  },
  { name: "package.json" },
];

export type RegistryListingClipProps = {
  command?: string;
  terminalSteps?: TerminalStep[];
  terminalSummary?: string;
  terminalPrompt?: string;
  directoryQuery?: string;
  directoryStars?: number;
  directoryItems?: number;
  fileTreeNodes?: FileNode[];
  selectedPath?: string;
  previewValue?: number;
  previewLabel?: string;
  ctaEyebrow?: string;
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  handles?: string[];
  accentColor?: string;
};

export const RegistryListingClip: React.FC<RegistryListingClipProps> = ({
  command = "npx shadcn@latest add @remotionui/social-clip",
  terminalSteps = DEFAULT_STEPS,
  terminalSummary = "Source in your repo. Every frame is yours to edit.",
  terminalPrompt = "~/my-video",
  directoryQuery = "@remotionui",
  directoryStars = 52,
  directoryItems = 224,
  fileTreeNodes = DEFAULT_NODES,
  selectedPath = "src/remotion/compositions/social-clip.tsx",
  previewValue = 200,
  previewLabel = "components in your repo",
  ctaEyebrow = "Available on registry.directory",
  ctaTitle = "200 components. Your repo.",
  ctaSubtitle = "Copy-paste Remotion components, installed with shadcn.",
  ctaLabel = "Browse the catalog",
  ctaUrl = "remotionui.com",
  handles = ["registry.directory", "github.com/riaz37/remotion-ui"],
  accentColor = COLORS.accent,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.stage }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.terminal}>
          <TerminalSimulator
            command={command}
            steps={terminalSteps}
            summary={terminalSummary}
            prompt={terminalPrompt}
            title="shadcn"
            shell="zsh"
            accentColor={accentColor}
            backgroundColor={COLORS.terminalBg}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...CUT_TERMINAL_TO_DIRECTORY} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.directory}>
          <RegistryDirectoryCard
            query={directoryQuery}
            stars={directoryStars}
            items={directoryItems}
            accentColor={accentColor}
            backgroundColor={COLORS.directoryBg}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...CUT_DIRECTORY_TO_TREE} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.tree}>
          <FileTreeReveal
            nodes={fileTreeNodes}
            title="my-video"
            selectedPath={selectedPath}
            rowStagger={0.16}
            accentColor={accentColor}
            backgroundColor={COLORS.treeBg}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...CUT_TREE_TO_DEVICE} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.device}>
          <DeviceMockupZoom
            device="browser"
            backgroundColor={COLORS.deviceBg}
            accentColor={accentColor}
          >
            <InstalledPreview
              value={previewValue}
              label={previewLabel}
              accentColor={accentColor}
            />
          </DeviceMockupZoom>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...CUT_DEVICE_TO_END} />

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
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
