import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { ChatGpt } from "@/remotion/scenes/chat-gpt";
import { ClaudeChat } from "@/remotion/scenes/claude-chat";
import { V0Composer } from "@/remotion/scenes/v0";
import { ClaudeCode } from "@/remotion/scenes/claude-code";
import { Opencode } from "@/remotion/scenes/opencode";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const BG = "#080810";
const PHOSPHOR = "#e8b86d";
const ENTER_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const EXIT_EASE = Easing.in(Easing.cubic);

const FADE = transitionFade({ durationInFrames: 12 });

const TITLE_DUR = 50;
const SCENE_DUR = 100;
const END_DUR = 55;
const END_EXIT_DUR = 18;

/* ─── shared pieces ─── */

const Logo: React.FC<{ size: number }> = ({ size }) => (
  <Img src={staticFile("logo.svg")} style={{ width: size, height: size }} />
);

const GlowDot: React.FC<{ delay: number; size: number }> = ({ delay, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, delay, config: { damping: 20 } });
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: PHOSPHOR,
        opacity: progress,
        boxShadow: `0 0 ${size * 2}px ${size * 0.5}px ${PHOSPHOR}55`,
      }}
    />
  );
};

/* ─── title card ─── */

const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const logoProgress = spring({ frame, fps, delay: 4, config: { damping: 14 } });
  const titleProgress = spring({ frame, fps, delay: 10, config: { damping: 16 } });
  const subProgress = spring({ frame, fps, delay: 18, config: { damping: 18 } });
  const exitProgress = interpolate(frame, [TITLE_DUR - 14, TITLE_DUR], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EXIT_EASE,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        justifyContent: "center",
        alignItems: "center",
        backgroundImage:
          "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(232,184,109,0.06), transparent)",
        opacity: exitProgress,
        fontFamily,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: scaleFont(24, width),
            opacity: logoProgress,
            transform: `scale(${logoProgress})`,
          }}
        >
          <Logo size={scaleFont(64, width)} />
        </div>
        <div
          style={{
            fontSize: scaleFont(68, width),
            fontWeight: 700,
            color: "#fff",
            letterSpacing: -1,
            opacity: titleProgress,
            transform: `translateY(${interpolate(titleProgress, [0, 1], [16, 0])}px)`,
          }}
        >
          AI Composers
        </div>
        <div
          style={{
            marginTop: scaleFont(14, width),
            fontSize: scaleFont(26, width),
            color: "rgba(255,255,255,0.5)",
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
  const { fps, width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });

  const labelProgress = spring({ frame, fps, delay: 6, config: { damping: 16 } });
  const featureProgress = spring({ frame, fps, delay: 22, config: { damping: 18 } });
  const exitProgress = interpolate(frame, [SCENE_DUR - 14, SCENE_DUR], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EXIT_EASE,
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: scaleFont(48, width),
        paddingBottom: Math.max(safe.paddingBottom, scaleFont(32, width)),
        paddingLeft: Math.max(safe.paddingLeft, scaleFont(48, width)),
        paddingRight: Math.max(safe.paddingRight, scaleFont(48, width)),
        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: scaleFont(16, width),
        opacity: exitProgress,
        fontFamily,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: scaleFont(12, width), minWidth: 0 }}>
        <div
          style={{
            opacity: labelProgress,
            transform: `translateX(${interpolate(labelProgress, [0, 1], [-12, 0])}px)`,
            flexShrink: 0,
          }}
        >
          <GlowDot delay={14} size={scaleFont(6, width)} />
        </div>
        <div
          style={{
            fontSize: scaleFont(28, width),
            fontWeight: 600,
            color: "#fff",
            letterSpacing: -0.3,
            opacity: labelProgress,
            transform: `translateX(${interpolate(labelProgress, [0, 1], [-8, 0])}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {config.name}
        </div>
      </div>
      <div
        style={{
          fontSize: scaleFont(18, width),
          fontWeight: 500,
          color: PHOSPHOR,
          opacity: featureProgress,
          transform: `translateX(${interpolate(featureProgress, [0, 1], [12, 0])}px)`,
          textAlign: "right",
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
  const { fps, width } = useVideoConfig();

  const logoProgress = spring({ frame, fps, delay: 4, config: { damping: 14 } });
  const titleProgress = spring({ frame, fps, delay: 10, config: { damping: 16 } });
  const tagProgress = spring({ frame, fps, delay: 18, config: { damping: 18 } });
  const exitProgress = interpolate(
    frame,
    [END_DUR - END_EXIT_DUR, END_DUR],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EXIT_EASE },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        justifyContent: "center",
        alignItems: "center",
        backgroundImage:
          "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(232,184,109,0.05), transparent)",
        opacity: exitProgress,
        fontFamily,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: scaleFont(20, width),
            opacity: logoProgress,
            transform: `scale(${logoProgress})`,
          }}
        >
          <Logo size={scaleFont(56, width)} />
        </div>
        <div
          style={{
            fontSize: scaleFont(48, width),
            fontWeight: 700,
            color: "#fff",
            letterSpacing: -0.5,
            opacity: titleProgress,
            transform: `translateY(${interpolate(titleProgress, [0, 1], [12, 0])}px)`,
          }}
        >
          remotionui.com
        </div>
        <div
          style={{
            marginTop: scaleFont(12, width),
            fontSize: scaleFont(22, width),
            color: PHOSPHOR,
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

        <TransitionSeries.Transition {...FADE} />

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
