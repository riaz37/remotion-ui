"use client";

import { SlideUp } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, PreviewGhostStack, ProductCard } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

const CARD_WIDTH = 590;
const CARD_MIN_HEIGHT = 258;
/** How far the landing outline sits outside the mask box. */
const LANDING_INSET = 16;

const Card: React.FC = () => (
  <ProductCard
    kicker={DEMO_COPY.productLaunch.subtitle}
    title={DEMO_COPY.productLaunch.title}
    detail={DEMO_COPY.productLaunch.featureTitle}
  />
);

/**
 * A ghost *copy* of the card is the wrong device for a vertical primitive: the
 * travelling card crosses the axis its ghost sits on, so the two headlines
 * landed line-for-line on the same baseline at both the enter and the exit
 * sample and two of the three tile frames were illegible. The mask made it
 * worse, not better — the ghost sits outside the mask, so the clip that is
 * supposed to hide the travelling copy did nothing about it.
 *
 * A dashed outline of the landing box carries the same information (where the
 * card is heading, and that it is clipped to that box on the way) and cannot
 * collide with type.
 */
const LandingBox: React.FC = () => {
  const tokens = usePreviewStage();

  return (
    <div
      style={{
        width: CARD_WIDTH + LANDING_INSET * 2,
        height: CARD_MIN_HEIGHT + LANDING_INSET * 2,
        borderRadius: 12,
        border: `2px dashed ${tokens.ink}`,
      }}
    />
  );
};

/**
 * Window is 96 frames, so the audit samples land on frames 14, 48 and 86.
 *
 * The exit is pinned rather than derived from the window: under `mask` the
 * travel is all `SlideUp` has — the mask branch deliberately leaves opacity
 * alone — and the default 60% exit travel on a 21-frame exit moved the card by
 * only 8% of its height by frame 86, so the hold and exit samples were nearly
 * the same picture. A full-distance exit over frames 66-96 has the card a third
 * of the way back down its mask at the exit sample.
 */
export const SlideUpPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <PreviewGhostStack ghost={<LandingBox />} ghostOpacity={0.32}>
      <SlideUp
        delayInFrames={6}
        durationInFrames={30}
        mask
        exitAtInFrames={66}
        exitInFrames={30}
        exitTravel={1}
      >
        <Card />
      </SlideUp>
    </PreviewGhostStack>
  </PreviewFrame>
);
