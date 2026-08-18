"use client";

import { FadeIn } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, PreviewGhostStack, ProductCard } from "./preview-frame";

const Card: React.FC = () => (
  <ProductCard
    kicker={DEMO_COPY.productLaunch.subtitle}
    title={DEMO_COPY.productLaunch.title}
    detail={DEMO_COPY.productLaunch.featureTitle}
  />
);

/**
 * The exit is placed by hand rather than left to land on the last frame of the
 * 96-frame window. `EASING_EXIT` is `Easing.in(Easing.cubic)`, so an exit that
 * ends on frame 96 is only 4% resolved at the audit's 90% sample (frame 86) and
 * that cell renders the same settled card as the 50% one. Starting it at 69
 * puts the *visual* half-fade — cubic-in solves t^3 = 0.5 at t = 0.794 — on
 * frame 86.5. The ghost holds the frame for the last five frames, so trading a
 * frozen tail here does not buy an empty one.
 */
export const FadeInPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <PreviewGhostStack ghost={<Card />}>
      <FadeIn
        delayInFrames={6}
        durationInFrames={22}
        exit
        exitInFrames={22}
        exitAtInFrames={69}
      >
        <Card />
      </FadeIn>
    </PreviewGhostStack>
  </PreviewFrame>
);
