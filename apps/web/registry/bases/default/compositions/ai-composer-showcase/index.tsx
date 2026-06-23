import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { ChatGpt } from "@/remotion/scenes/chat-gpt";
import { ClaudeChat } from "@/remotion/scenes/claude-chat";
import { V0Composer } from "@/remotion/scenes/v0";
import { ClaudeCode } from "@/remotion/scenes/claude-code";
import { Opencode } from "@/remotion/scenes/opencode";

const BG = "#080810";
const PHOSPHOR = "#e8b86d";

const FADE = transitionFade({ durationInFrames: 12 });

const TITLE_DUR = 50;
const SCENE_DUR = 100;
const END_DUR = 55;

/* ─── shared pieces ─── */

const Logo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <Img
    src={staticFile("logo.svg")}
    style={{ width: size, height: size }}
  />
);

const GlowDot: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, delay, config: { damping: 20 } });
  return (
    <div
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: PHOSPHOR,
        opacity: progress,
        boxShadow: `0 0 12px 3px ${PHOSPHOR}55`,
      }}
    />
  );
};

/* ─── title card ─── */

const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoProgress = spring({ frame, fps, delay: 4, config: { damping: 14 } });
  const titleProgress = spring({ frame, fps, delay: 10, config: { damping: 16 } });
  const subProgress = spring({ frame, fps, delay: 18, config: { damping: 18 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        justifyContent: "center",
        alignItems: "center",
        backgroundImage:
          "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(232,184,109,0.06), transparent)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 24,
            opacity: logoProgress,
            transform: `scale(${logoProgress})`,
          }}
        >
          <Logo size={64} />
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: -1,
            opacity: titleProgress,
            transform: `translateY(${interpolate(titleProgress, [0, 1], [16, 0])}px)`,
          }}
        >
          AI Composers
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 26,
            color: "rgba(255,255,255,0.5)",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 400,
            opacity: subProgress,
            transform: `translateY(${interpolate(subProgress, [0, 1], [10, 0])}px)`,
          }}
        >
          Five interfaces. Animated. Source you own.
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ─── scene wrapper with label + feature callout ─── */

type SceneConfig = {
  name: string;
  feature: string;
};

const SceneLabel: React.FC<{ config: SceneConfig }> = ({ config }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelProgress = spring({ frame, fps, delay: 6, config: { damping: 16 } });
  const dotProgress = spring({ frame, fps, delay: 14, config: { damping: 14 } });
  const featureProgress = spring({ frame, fps, delay: 22, config: { damping: 18 } });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "32px 48px",
        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            opacity: labelProgress,
            transform: `translateX(${interpolate(labelProgress, [0, 1], [-12, 0])}px)`,
          }}
        >
          <GlowDot delay={14} />
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: -0.3,
            opacity: labelProgress,
            transform: `translateX(${interpolate(labelProgress, [0, 1], [-8, 0])}px)`,
          }}
        >
          {config.name}
        </div>
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 500,
          color: PHOSPHOR,
          fontFamily: "system-ui, sans-serif",
          opacity: featureProgress,
          transform: `translateX(${interpolate(featureProgress, [0, 1], [12, 0])}px)`,
        }}
      >
        {config.feature}
      </div>
    </div>
  );
};

const SCENES: Array<{
  Component: React.FC;
  config: SceneConfig;
}> = [
  { Component: ChatGpt, config: { name: "ChatGPT", feature: "Typed prompts + suggestion chips" } },
  { Component: ClaudeChat, config: { name: "Claude", feature: "Artifact split view + streaming" } },
  { Component: V0Composer, config: { name: "v0", feature: "Model selectors + quick actions" } },
  { Component: ClaudeCode, config: { name: "Claude Code", feature: "Terminal UI + CLI typing" } },
  { Component: Opencode, config: { name: "OpenCode", feature: "TUI input + agent status" } },
];

/* ─── end card ─── */

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoProgress = spring({ frame, fps, delay: 4, config: { damping: 14 } });
  const titleProgress = spring({ frame, fps, delay: 10, config: { damping: 16 } });
  const tagProgress = spring({ frame, fps, delay: 18, config: { damping: 18 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        justifyContent: "center",
        alignItems: "center",
        backgroundImage:
          "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(232,184,109,0.05), transparent)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 20,
            opacity: logoProgress,
            transform: `scale(${logoProgress})`,
          }}
        >
          <Logo size={56} />
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: -0.5,
            opacity: titleProgress,
            transform: `translateY(${interpolate(titleProgress, [0, 1], [12, 0])}px)`,
          }}
        >
          remotionui.com
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 22,
            color: PHOSPHOR,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 500,
            opacity: tagProgress,
            transform: `translateY(${interpolate(tagProgress, [0, 1], [8, 0])}px)`,
          }}
        >
          Source you own. Ship your story.
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ─── main composition ─── */

export const AiComposerShowcase: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={TITLE_DUR}>
          <TitleCard />
        </TransitionSeries.Sequence>

        {SCENES.map(({ Component, config }, i) => (
          <TransitionSeries.Sequence key={config.name} durationInFrames={SCENE_DUR}>
            <AbsoluteFill>
              <Component />
              <SceneLabel config={config} />
            </AbsoluteFill>
          </TransitionSeries.Sequence>
        )).reduce<React.ReactNode[]>((acc, seq, i) => {
          if (i > 0) acc.push(<TransitionSeries.Transition key={`t-${i}`} {...FADE} />);
          acc.push(seq);
          return acc;
        }, [])}

        <TransitionSeries.Transition {...FADE} />

        <TransitionSeries.Sequence durationInFrames={END_DUR}>
          <EndCard />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
