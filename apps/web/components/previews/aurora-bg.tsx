"use client";

import { AuroraBg } from "../../registry/bases/default/primitives/aurora-bg";
import { PreviewFrame, ProductCard } from "./preview-frame";

/**
 * The audit samples at 15% / 50% / 90%: frames 18, 60 and 108 on the 120-frame
 * default. Every curtain folds on a 2.3s clock beaten against a 1.1s one, so no
 * fold returns to a shape it has already held inside the window and all three
 * samples catch a different sky. There is no entrance to run out of.
 *
 * A card sits on top because this is a stage layer: a background only ever
 * shown empty says nothing about how it reads under type.
 */
export const AuroraBgPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <AuroraBg ribbonCount={5} amplitude={13} thickness={13} blur={12} intensity={1.4} />
    <PreviewFrame lane="blocks" backgroundColor="transparent" padding={72}>
      <ProductCard
        kicker="Aurora ribbons"
        title="Aurora"
        detail="Five ribbons fold across two overlapping timing beats."
      />
    </PreviewFrame>
  </PreviewFrame>
);
