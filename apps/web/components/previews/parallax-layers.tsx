"use client";

import { AbsoluteFill } from "remotion";
import { ParallaxLayers } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, ProductCard } from "./preview-frame";

const BackPlane: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(90% 70% at 50% 88%, rgba(232,184,109,0.22) 0%, transparent 62%)",
    }}
  >
    {[12, 26, 41, 58, 72, 87].map((left, index) => (
      <div
        key={left}
        style={{
          position: "absolute",
          left: `${left}%`,
          bottom: "22%",
          width: 84,
          height: 190 + (index % 3) * 90,
          borderRadius: 6,
          background: "rgba(255,255,255,0.14)",
          border: "1px solid rgba(255,255,255,0.22)",
        }}
      />
    ))}
  </AbsoluteFill>
);

const FrontPlane: React.FC = () => (
  <AbsoluteFill>
    {[
      { left: -4, flip: false },
      { left: 93, flip: true },
    ].map(({ left, flip }) => (
      <div
        key={left}
        style={{
          position: "absolute",
          left: `${left}%`,
          top: "-10%",
          width: "11%",
          height: "120%",
          background: flip
            ? "linear-gradient(270deg, rgba(232,184,109,0.62), rgba(232,184,109,0.05))"
            : "linear-gradient(90deg, rgba(232,184,109,0.62), rgba(232,184,109,0.05))",
        }}
      />
    ))}
  </AbsoluteFill>
);

/**
 * The camera sweeps once across the whole window, so the three samples sit at
 * three points of one continuous move rather than on a loop that could alias
 * against the 42 and 48-frame sample gaps.
 *
 * Three planes with visibly different content at different depths — the point
 * of the component is the *relative* rates, which a single plate cannot show.
 */
export const ParallaxLayersPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <ParallaxLayers
      travel={460}
      zoom={0.16}
      layers={[
        { content: <BackPlane />, depth: 0.18, blur: 1.5, opacity: 0.9 },
        {
          content: (
            <PreviewFrame lane="blocks" backgroundColor="transparent" padding={72}>
              <ProductCard
                kicker="Three planes, one driver"
                title="Parallax"
                detail={DEMO_COPY.productLaunch.subtitle}
              />
            </PreviewFrame>
          ),
          depth: 0.55,
        },
        { content: <FrontPlane />, depth: 1, blur: 9, opacity: 0.75 },
      ]}
    />
  </PreviewFrame>
);
