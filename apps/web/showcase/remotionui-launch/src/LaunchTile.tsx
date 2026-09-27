import type { ComponentType } from "react";
import { AbsoluteFill } from "remotion";
import {
  BlurFocusInPreview,
  InfiniteMarqueePreview,
  LightSweepTextPreview,
  MaskedSlideRevealPreview,
  MatrixDecodePreview,
  PerspectiveMarqueePreview,
  RgbGlitchTextPreview,
  SlotRollPreview,
  StaggeredFadeUpPreview,
  TrackingInPreview,
} from "../../../components/previews/text-effects-previews";
import { StrikethroughReplacePreview } from "../../../components/previews/strikethrough-replace";
import { LightTunnelBgPreview } from "../../../components/previews/light-tunnel-bg";
import { TextRevealShaderPreview } from "../../../components/previews/text-reveal-shader";
import { DitherFieldBgPreview } from "../../../components/previews/dither-field-bg";
import { WarpBandsBgPreview } from "../../../components/previews/warp-bands-bg";
import { GrainGradientBgPreview } from "../../../components/previews/grain-gradient-bg";
import { ProductTurntable3dPreview } from "../../../components/previews/product-turntable-3d";
import { TextExtrude3dPreview } from "../../../components/previews/text-extrude-3d";
import { CardStack3dPreview } from "../../../components/previews/card-stack-3d";
import { GlobePoints3dPreview } from "../../../components/previews/globe-points-3d";
import type { MISSING_POSTERS } from "./facts";

/**
 * LaunchTile: a 960×540 still of a component's own docs preview, for the 20
 * components that have no poster in public/previews. Rendered once by
 * scripts/render-tiles.sh into public/remotionui-launch/tiles/<slug>.jpg.
 */

const PREVIEWS: Record<(typeof MISSING_POSTERS)[number], ComponentType> = {
  "blur-focus-in": BlurFocusInPreview,
  "staggered-fade-up": StaggeredFadeUpPreview,
  "masked-slide-reveal": MaskedSlideRevealPreview,
  "tracking-in": TrackingInPreview,
  "light-sweep-text": LightSweepTextPreview,
  "slot-roll": SlotRollPreview,
  "matrix-decode": MatrixDecodePreview,
  "rgb-glitch-text": RgbGlitchTextPreview,
  "infinite-marquee": InfiniteMarqueePreview,
  "perspective-marquee": PerspectiveMarqueePreview,
  "strikethrough-replace": StrikethroughReplacePreview,
  "light-tunnel-bg": LightTunnelBgPreview,
  "text-reveal-shader": TextRevealShaderPreview,
  "dither-field-bg": DitherFieldBgPreview,
  "warp-bands-bg": WarpBandsBgPreview,
  "grain-gradient-bg": GrainGradientBgPreview,
  "product-turntable-3d": ProductTurntable3dPreview,
  "text-extrude-3d": TextExtrude3dPreview,
  "card-stack-3d": CardStack3dPreview,
  "globe-points-3d": GlobePoints3dPreview,
};

export const LaunchTile: React.FC<{ slug: string }> = ({ slug }) => {
  const Preview = PREVIEWS[slug as keyof typeof PREVIEWS];
  if (!Preview) {
    throw new Error(`LaunchTile: no preview wrapper mapped for "${slug}"`);
  }
  return (
    <AbsoluteFill style={{ background: "#07070a" }}>
      <Preview />
    </AbsoluteFill>
  );
};
