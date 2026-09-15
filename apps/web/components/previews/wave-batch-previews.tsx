"use client";

import { AiComposerShowcase } from "../../registry/bases/default/compositions/ai-composer-showcase";
import { AiGenerationCanvas } from "../../registry/bases/default/compositions/ai-generation-canvas";
import { BentoPan } from "../../registry/bases/default/compositions/bento-pan";
import { BrowserFlow } from "../../registry/bases/default/compositions/browser-flow";
import { DashboardPopulate } from "../../registry/bases/default/compositions/dashboard-populate";
import { DeployReveal } from "../../registry/bases/default/compositions/deploy-reveal";
import { EcosystemOrbit } from "../../registry/bases/default/compositions/ecosystem-orbit";
import { HeroDeviceAssemble } from "../../registry/bases/default/compositions/hero-device-assemble";
import { ImageExpand } from "../../registry/bases/default/compositions/image-expand";
import { LandingCodeShowcase } from "../../registry/bases/default/compositions/landing-code-showcase";
import { LiveCodeSplit } from "../../registry/bases/default/compositions/live-code-split";
import { PricingFocus } from "../../registry/bases/default/compositions/pricing-focus";
import { ToolMenuSlide } from "../../registry/bases/default/compositions/tool-menu-slide";
import { DEMO_PHOTO_SRC } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

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
export const AiComposerShowcasePreview = () => (
  <PreviewFrame lane="reels" padding={0}><AiComposerShowcase /></PreviewFrame>
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
  <PreviewFrame lane="reels" padding={0}>
    <ImageExpand
      src={DEMO_PHOTO_SRC}
      eyebrow="Chapter three"
      title="Golden hour"
      subtitle="Shot on the ridge road, 40 minutes before dark"
    />
  </PreviewFrame>
);
