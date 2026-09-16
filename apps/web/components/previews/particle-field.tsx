"use client";

import { ParticleField } from "../../registry/bases/default/primitives/particle-field";
import { PreviewFrame, ProductCard } from "./preview-frame";

/**
 * Samples land at frames 18, 60 and 108. A near particle crosses the frame in
 * about six seconds here, so it travels roughly a quarter of the frame between
 * adjacent samples, so the field is unmistakably in a different arrangement at
 * each one, with no entrance to run out of.
 */
export const ParticleFieldPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <ParticleField count={80} size={18} minSize={3} speed={1.35} glow={1.8} drift={5} />
    <PreviewFrame lane="blocks" backgroundColor="transparent" padding={72}>
      <ProductCard
        kicker="Drifting particles"
        title="Particle field"
        detail="Eighty glowing particles drift the frame at their own pace."
      />
    </PreviewFrame>
  </PreviewFrame>
);
