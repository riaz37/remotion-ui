import type { ReactNode } from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { TextExtrude3d } from "@/remotion/scenes/text-extrude-3d";
import { CodeReveal } from "@/remotion/scenes/code-reveal";
import { DonutChart } from "@/remotion/primitives/donut-chart";
import { AuroraBg } from "@/remotion/primitives/aurora-bg";
import { GlobePoints3d } from "@/remotion/scenes/globe-points-3d";
import { transitionGridPixelateWipe } from "@/remotion/primitives/grid-pixelate-wipe";
import { TitleCard } from "@/remotion/scenes/title-card";
import { MatrixDecode } from "@/remotion/primitives/matrix-decode";
import { LightTunnelBg } from "@/remotion/primitives/light-tunnel-bg";
import { SpeakerLabelCaptions } from "@/remotion/primitives/speaker-label-captions";
import { RadarChart } from "@/remotion/primitives/radar-chart";
import { CardStack3d } from "@/remotion/scenes/card-stack-3d";
import { HandwritingText } from "@/remotion/primitives/handwriting-text";
import { WarpBandsBg } from "@/remotion/primitives/warp-bands-bg";
import { WaveformBarsRadial } from "@/remotion/primitives/waveform-bars-radial";
import { GaugeDial } from "@/remotion/primitives/gauge-dial";
import { LiquidTextMorph } from "@/remotion/primitives/liquid-text-morph";
import { LogoReveal } from "@/remotion/scenes/logo-reveal";
import { COLORS, SANS } from "../theme";

/**
 * slots.tsx: the montage's 17 real registry components.
 *
 * Each renders full-frame at 1920×1080 (the film's size, which their
 * useVideoConfig reports) and is scaled into the card. `offset` is the
 * component's own frame at the start of its cut, picked from its timing so it
 * is mid-motion in the slot rather than on its empty first frame. Colours are
 * held to the film's one accent wherever the component takes them.
 */

const caveat = loadCaveat("normal", { weights: ["600"], subsets: ["latin"] });

/** Phosphor and its tints: the single-accent palette for multi-series components. */
const TINTS = [COLORS.phosphor, "#b98a47", "#6f5a3c", "#3d3429"];

const Stage: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 70% 60% at 50% 45%, rgba(${COLORS.phosphorRgb},0.07), transparent 70%), #07070a`,
      alignItems: "center",
      justifyContent: "center",
      fontFamily: SANS,
    }}
  >
    {children}
  </AbsoluteFill>
);

/** The RemotionUI mark from public/logo.svg as stroke paths (the -1.5,-1 group offset applied). */
export const MARK_PATHS = [
  "M6.5 5H18.5A3 3 0 0 1 21.5 8V15A3 3 0 0 1 18.5 18H6.5A3 3 0 0 1 3.5 15V8A3 3 0 0 1 6.5 5Z",
  "M10.5 9H22.5A3 3 0 0 1 25.5 12V19A3 3 0 0 1 22.5 22H10.5A3 3 0 0 1 7.5 19V12A3 3 0 0 1 10.5 9Z",
  "M14 13.5V18.5L18.5 16L14 13.5Z",
];

const SPEAKER_CUES = [
  { speaker: "Nadia", text: "So the whole edit is code now?", startMs: 0, endMs: 1250 },
  { speaker: "Sam", text: "Every scene. The captions come from the transcript.", startMs: 1300, endMs: 2550 },
];

const EXPLAINER = `import { CalloutSpotlight } from "@/remotion/scenes";

export const Explainer = () => (
  <CalloutSpotlight
    title="Explain the action"
    target={{ x: 520, y: 260 }}
  />
);`;

const PixelateWipe: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={44}>
      <TitleCard title="Scene one" eyebrow="Cut" accentColor={COLORS.phosphor} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition {...transitionGridPixelateWipe({ durationInFrames: 26 })} />
    <TransitionSeries.Sequence durationInFrames={60}>
      <TitleCard title="Scene two" eyebrow="Wipe" theme="light" accentColor={COLORS.phosphor} />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);

export type Slot = { slug: string; lane: string; offset: number; render: () => ReactNode };

export const SLOTS: Slot[] = [
  {
    slug: "text-extrude-3d",
    lane: "3D",
    offset: 38,
    render: () => (
      <TextExtrude3d
        fontUrl={staticFile("fonts/geist-bold.typeface.json")}
        accentColor={COLORS.phosphor}
        backgroundColor="#070605"
        glowColor="#2a2116"
        rimColor={COLORS.phosphor}
      />
    ),
  },
  {
    slug: "code-reveal",
    lane: "Code & terminal",
    offset: 120,
    render: () => (
      <CodeReveal title="explainer.tsx" code={EXPLAINER} highlightedLines={[4, 5, 6]} accentColor={COLORS.phosphor} />
    ),
  },
  {
    slug: "donut-chart",
    lane: "Charts",
    offset: 20,
    render: () => (
      <Stage>
        <DonutChart
          segments={[
            { label: "Direct", value: 4820 },
            { label: "Search", value: 3140 },
            { label: "Social", value: 1960 },
            { label: "Referral", value: 880 },
          ]}
          colors={TINTS}
          size={600}
          totalLabel="Sessions"
          delayInFrames={0}
          durationInFrames={34}
          staggerInFrames={16}
        />
      </Stage>
    ),
  },
  {
    slug: "aurora-bg",
    lane: "Backgrounds",
    offset: 40,
    render: () => (
      <AuroraBg colors={[COLORS.phosphor, "#c98b3c", "#7a5226"]} ribbonCount={5} amplitude={13} thickness={13} blur={12} intensity={1.4} />
    ),
  },
  {
    slug: "globe-points-3d",
    lane: "3D",
    offset: 50,
    render: () => (
      <GlobePoints3d
        backgroundColor="#070605"
        globeColor="#1a1612"
        landColor="#d9c3a0"
        rimColor={COLORS.phosphor}
        atmosphereColor="#b98a47"
        accentColor={COLORS.phosphor}
        markerColor={COLORS.phosphor}
        arcColor={COLORS.phosphor}
      />
    ),
  },
  {
    slug: "grid-pixelate-wipe",
    lane: "Transitions",
    offset: 22,
    render: () => <PixelateWipe />,
  },
  {
    slug: "matrix-decode",
    lane: "Text effects",
    offset: 22,
    render: () => (
      <Stage>
        <MatrixDecode text="SOURCE YOU OWN" fontSize={124} durationInFrames={56} color={COLORS.ink} hotColor={COLORS.phosphor} seed={7} />
      </Stage>
    ),
  },
  {
    slug: "light-tunnel-bg",
    lane: "Shaders",
    offset: 40,
    render: () => <LightTunnelBg colors={[COLORS.phosphor, "#f6dcae", "#8a561c"]} />,
  },
  {
    slug: "speaker-label-captions",
    lane: "Captions",
    offset: 14,
    render: () => (
      <Stage>
        <SpeakerLabelCaptions
          cues={SPEAKER_CUES}
          speakers={[
            { name: "Nadia", color: COLORS.phosphor, align: "left" },
            { name: "Sam", color: COLORS.muted, align: "right" },
          ]}
          fontSize={104}
        />
      </Stage>
    ),
  },
  {
    slug: "radar-chart",
    lane: "Charts",
    offset: 44,
    render: () => (
      <Stage>
        <RadarChart
          axes={["Speed", "Polish", "Reuse", "Docs", "Types", "Motion"]}
          series={[
            { label: "Hand-rolled", values: [42, 38, 24, 30, 46, 34] },
            { label: "RemotionUI", values: [88, 92, 84, 78, 90, 86] },
          ]}
          colors={["#6b6b6b", COLORS.phosphor]}
          size={820}
          maxValue={100}
          delayInFrames={4}
          durationInFrames={20}
          staggerInFrames={7}
          seriesOffsetInFrames={26}
        />
      </Stage>
    ),
  },
  {
    slug: "card-stack-3d",
    lane: "3D",
    offset: 56,
    render: () => (
      <CardStack3d
        colors={[COLORS.phosphor, "#c9a36b", "#8f7550", "#5b4b36", "#3a3128"]}
        backgroundColor="#070605"
        glowColor="#2a2116"
        floorColor="#3d352b"
        rimColor={COLORS.phosphor}
        accentColor={COLORS.phosphor}
      />
    ),
  },
  {
    slug: "handwriting-text",
    lane: "Text effects",
    offset: 58,
    render: () => (
      <Stage>
        <HandwritingText
          text="Signed by hand"
          fontFamily={caveat.fontFamily}
          delayInFrames={2}
          staggerInFrames={6}
          durationInFrames={14}
          penSize={0.16}
          penColor={COLORS.phosphor}
          fontSize={190}
        />
      </Stage>
    ),
  },
  {
    slug: "warp-bands-bg",
    lane: "Shaders",
    offset: 30,
    render: () => <WarpBandsBg colors={["#0b0a08", COLORS.phosphor, "#0b0a08", "#8a5a24"]} />,
  },
  {
    slug: "waveform-bars-radial",
    lane: "Audio",
    offset: 45,
    render: () => (
      <Stage>
        <WaveformBarsRadial
          src={staticFile("media/demo-loop.wav")}
          radius={250}
          barCount={96}
          maxLength={170}
          color={COLORS.ink}
          peakColor={COLORS.phosphor}
        >
          <div style={{ textAlign: "center", color: COLORS.ink, fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>Episode 12</div>
        </WaveformBarsRadial>
      </Stage>
    ),
  },
  {
    slug: "gauge-dial",
    lane: "Charts",
    offset: 34,
    render: () => (
      <Stage>
        <GaugeDial value={78} label="Render budget" unit="%" size={640} color={COLORS.phosphor} delayInFrames={10} durationInFrames={70} />
      </Stage>
    ),
  },
  {
    slug: "liquid-text-morph",
    lane: "Text effects",
    offset: 18,
    render: () => (
      <Stage>
        <LiquidTextMorph words={["Melt", "Merge", "Reform"]} holdInFrames={12} morphInFrames={22} gooStrength={0.05} gooContrast={18} fontSize={280} color={COLORS.ink} />
      </Stage>
    ),
  },
  {
    slug: "logo-reveal",
    lane: "Paths & logo",
    offset: 86,
    // strokeWidth is in viewBox units: the scene's default (a share of the pixel size) floods a 32-unit mark.
    render: () => <LogoReveal pathD={MARK_PATHS} viewBox="2 3 25 21" strokeWidth={0.7} stroke={COLORS.phosphor} backgroundColor="#07070a" />,
  },
];
