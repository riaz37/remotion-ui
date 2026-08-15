"use client";

import { AbsoluteFill } from "remotion";
import { DepthOfFieldBlur } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, ProductCard } from "./preview-frame";

const FarPlane: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "radial-gradient(80% 80% at 22% 22%, rgba(232,184,109,0.24) 0%, transparent 60%)",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 78,
        top: 62,
        width: 300,
        padding: "26px 30px",
        borderRadius: 8,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "rgba(236,236,236,0.75)",
        fontSize: 30,
        fontWeight: 600,
      }}
    >
      Background plate
    </div>
  </AbsoluteFill>
);

const NearPlane: React.FC = () => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute",
        right: 54,
        bottom: 44,
        padding: "24px 36px",
        borderRadius: 999,
        background: "#e8b86d",
        color: "#100c06",
        fontSize: 34,
        fontWeight: 600,
      }}
    >
      Foreground chip
    </div>
  </AbsoluteFill>
);

/**
 * One rack across the window, not a loop: the samples at frames 18, 60 and 108
 * sit at the start, the middle and the end of a monotonic focus pull, so they
 * cannot alias against the 42 and 48-frame gaps the way a periodic preview can.
 *
 * The rack is timed so each sample lands on a *plane*, not between two. It
 * starts at frame 24 and runs 66 frames, which puts the focus on depth 1 at
 * frame 18, on 0.4 at frame 60 and on 0 at frame 108 — the card's depth is 0.4
 * for exactly that reason. The first cut racked evenly across the window and
 * the middle sample caught the lens between planes, so the tile's most-seen
 * frame was one where nothing was sharp.
 *
 * Three planes at three depths and three places in the frame — a rack focus is
 * only visible as a relationship between planes.
 */
export const DepthOfFieldBlurPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <DepthOfFieldBlur
      focusFrom={1}
      focusTo={0}
      startAtInFrames={24}
      durationInFrames={66}
      maxBlur={20}
      aperture={2.6}
      dim={0.4}
      layers={[
        { content: <FarPlane />, depth: 1 },
        {
          content: (
            <PreviewFrame lane="blocks" backgroundColor="transparent" padding={72}>
              <ProductCard
                kicker="Rack focus"
                title="Depth of field"
                detail={DEMO_COPY.productLaunch.subtitle}
              />
            </PreviewFrame>
          ),
          depth: 0.4,
        },
        { content: <NearPlane />, depth: 0 },
      ]}
    />
  </PreviewFrame>
);
