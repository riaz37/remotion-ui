"use client";

import { NeonFlickerText } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default. A 5-frame stagger keeps tubes striking until frame ~85,
 * so the first two samples are both mid-ignition, and the sign cuts out again
 * from frame 92 so the third catches it dying. The hum and the stutter alone
 * measured as a still tail against the audit — a settled sign is nearly a PNG,
 * so the preview does not end on one.
 */
const stage = {
  display: "grid",
  placeItems: "center",
  width: "100%",
  textAlign: "center" as const,
};

export const NeonFlickerTextPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={stage}>
      <NeonFlickerText
        text="Open all night"
        order="random"
        seed={4}
        delayInFrames={2}
        staggerInFrames={5}
        durationInFrames={22}
        exitAtInFrames={92}
        exitInFrames={22}
        exitStaggerInFrames={1}
        glowColor="#f472b6"
        glowSize={30}
        fontSize={88}
        fontWeight={700}
      />
    </div>
  </PreviewFrame>
);
