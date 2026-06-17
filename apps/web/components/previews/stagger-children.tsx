"use client";

import { Sequence } from "remotion";
import { FadeIn, StaggerChildren } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, ProductCard } from "./preview-frame";

const staggerBeats = [
  {
    kicker: DEMO_COPY.productLaunch.subtitle,
    title: DEMO_COPY.productLaunch.title,
    detail: DEMO_COPY.productLaunch.featureItems[0],
  },
  {
    kicker: DEMO_COPY.productLaunch.featureTitle,
    title: DEMO_COPY.productLaunch.featureItems[1],
    detail: DEMO_COPY.tutorial.calloutSubtitle,
  },
];

export const StaggerChildrenPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <div style={{ display: "grid", placeItems: "center", transform: "scale(0.8)" }}>
      <div
        style={{
          gridArea: "1 / 1",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          alignItems: "center",
          opacity: 0.18,
        }}
      >
        {staggerBeats.map((beat) => (
          <ProductCard
            key={`ghost-${beat.title}`}
            kicker={beat.kicker}
            title={beat.title}
            detail={beat.detail}
          />
        ))}
      </div>
      <div style={{ gridArea: "1 / 1" }}>
        <Sequence from={8} layout="none">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              alignItems: "center",
            }}
          >
            <StaggerChildren staggerInFrames={12}>
              {staggerBeats.map((beat) => (
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
        </Sequence>
      </div>
    </div>
  </PreviewFrame>
);
