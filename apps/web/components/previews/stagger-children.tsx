"use client";

import { FadeIn, StaggerChildren } from "../registry-exports";
import { PreviewFrame, ProductCard } from "./preview-frame";

export const StaggerChildrenPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        alignItems: "center",
      }}
    >
      <StaggerChildren staggerInFrames={12}>
        {[
          { kicker: "Beat 1", title: "Open the hook", detail: "First card enters" },
          { kicker: "Beat 2", title: "Show the proof", detail: "Staggered by 12 frames" },
          { kicker: "Beat 3", title: "Land the CTA", detail: "Each child animates in" },
        ].map((beat) => (
          <FadeIn key={beat.title} durationInFrames={20}>
            <ProductCard
              kicker={beat.kicker}
              title={beat.title}
              detail={beat.detail}
            />
          </FadeIn>
        ))}
      </StaggerChildren>
    </div>
  </PreviewFrame>
);
