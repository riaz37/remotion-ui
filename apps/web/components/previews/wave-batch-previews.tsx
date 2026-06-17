"use client";

import {
  AiGenerationCanvas,
  BentoPan,
  BrowserFlow,
  ChatToPreview,
  CodeAccordion,
  CodeDiffWipe,
  ConfettiBurst,
  DashboardPopulate,
  DataFlowPipes,
  DeployReveal,
  DeviceMockupZoom,
  DragDropFlow,
  DynamicGrid,
  EcosystemOrbit,
  HeroDeviceAssemble,
  ImageExpand,
  LandingCodeShowcase,
  LiveCodeSplit,
  MeshGradientBg,
  PricingFocus,
  SimulatedCursor,
  TerminalSimulator,
  ToolMenuSlide,
} from "../registry-exports";
import { PreviewFrame } from "./preview-frame";
import { TransitionSeriesPreview } from "./transition-previews";
import {
  transitionChromaticAberrationWipe,
  transitionDirectionalWipe,
  transitionSpatialPush,
  transitionZoomThrough,
} from "../registry-exports";

const center = { display: "grid", placeItems: "center", width: "100%", height: "100%" } as const;

export const MeshGradientBgPreview = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <MeshGradientBg />
    <div style={{ ...center, position: "absolute", inset: 0, color: "#f4f4f5", fontWeight: 600 }}>Mesh gradient</div>
  </PreviewFrame>
);

export const DynamicGridPreview = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <DynamicGrid />
  </PreviewFrame>
);

function TransitionDemo({ transition }: { transition: { presentation: unknown; timing: unknown } }) {
  return (
    <PreviewFrame lane="cuts" padding={0}>
      <TransitionSeriesPreview transition={transition} />
    </PreviewFrame>
  );
}

export const DirectionalWipePreview = () => <TransitionDemo transition={transitionDirectionalWipe()} />;
export const SpatialPushPreview = () => <TransitionDemo transition={transitionSpatialPush()} />;
export const ChromaticAberrationWipePreview = () => <TransitionDemo transition={transitionChromaticAberrationWipe()} />;
export const ZoomThroughPreview = () => <TransitionDemo transition={transitionZoomThrough()} />;

export const ConfettiBurstPreview = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#080810" }}>
      <ConfettiBurst />
    </div>
  </PreviewFrame>
);

export const SimulatedCursorPreview = () => (
  <PreviewFrame lane="vectors" padding={0}>
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#080810" }}>
      <SimulatedCursor />
    </div>
  </PreviewFrame>
);

export const DeviceMockupZoomPreview = () => (
  <PreviewFrame lane="spatial" padding={0}><DeviceMockupZoom /></PreviewFrame>
);
export const TerminalSimulatorPreview = () => (
  <PreviewFrame lane="blocks" padding={0}><TerminalSimulator /></PreviewFrame>
);
export const CodeAccordionPreview = () => (
  <PreviewFrame lane="blocks" padding={0}><CodeAccordion /></PreviewFrame>
);
export const CodeDiffWipePreview = () => (
  <PreviewFrame lane="blocks" padding={0}>
    <CodeDiffWipe before={"const x = 1;\nreturn x;"} after={"const x = 2;\nreturn x * 2;"} />
  </PreviewFrame>
);
export const DataFlowPipesPreview = () => (
  <PreviewFrame lane="blocks" padding={0}><DataFlowPipes /></PreviewFrame>
);
export const DragDropFlowPreview = () => (
  <PreviewFrame lane="blocks" padding={0}><DragDropFlow /></PreviewFrame>
);
export const ChatToPreviewPreview = () => (
  <PreviewFrame lane="blocks" padding={0}>
    <ChatToPreview
      messages={[{ role: "user", text: "Generate a product launch clip" }]}
    />
  </PreviewFrame>
);

export const HeroDeviceAssemblePreview = () => (
  <PreviewFrame lane="reels" padding={0}><HeroDeviceAssemble /></PreviewFrame>
);
export const EcosystemOrbitPreview = () => (
  <PreviewFrame lane="reels" padding={0}><EcosystemOrbit /></PreviewFrame>
);
export const BentoPanPreview = () => (
  <PreviewFrame lane="reels" padding={0}><BentoPan /></PreviewFrame>
);
export const BrowserFlowPreview = () => (
  <PreviewFrame lane="reels" padding={0}><BrowserFlow /></PreviewFrame>
);
export const AiGenerationCanvasPreview = () => (
  <PreviewFrame lane="reels" padding={0}><AiGenerationCanvas /></PreviewFrame>
);
export const LiveCodeSplitPreview = () => (
  <PreviewFrame lane="reels" padding={0}><LiveCodeSplit /></PreviewFrame>
);
export const DeployRevealPreview = () => (
  <PreviewFrame lane="reels" padding={0}><DeployReveal /></PreviewFrame>
);
export const DashboardPopulatePreview = () => (
  <PreviewFrame lane="reels" padding={0}><DashboardPopulate /></PreviewFrame>
);
export const PricingFocusPreview = () => (
  <PreviewFrame lane="reels" padding={0}><PricingFocus /></PreviewFrame>
);
export const LandingCodeShowcasePreview = () => (
  <PreviewFrame lane="reels" padding={0}><LandingCodeShowcase /></PreviewFrame>
);
export const ToolMenuSlidePreview = () => (
  <PreviewFrame lane="reels" padding={0}><ToolMenuSlide /></PreviewFrame>
);
export const ImageExpandPreview = () => (
  <PreviewFrame lane="reels" padding={0}><ImageExpand /></PreviewFrame>
);
