"use client";

import { SlideUp, StaggerChildren } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, PreviewKicker } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

const rows = DEMO_COPY.productLaunch.featureItems;

const Row: React.FC<{ index: number; label: string }> = ({ index, label }) => {
  const tokens = usePreviewStage();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        width: 640,
        padding: "26px 32px",
        borderRadius: 8,
        background: tokens.panelFill,
        border: `1px solid ${tokens.panelBorder}`,
      }}
    >
      <span
        style={{
          color: tokens.muted,
          fontSize: 26,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <span style={{ color: tokens.ink, fontSize: 32, fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
};

/** Rows arrive in order and leave in the same order — one wave, both ways. */
export const StaggerChildrenPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <div style={{ display: "grid", gap: 26, justifyItems: "center" }}>
      <PreviewKicker>{DEMO_COPY.productLaunch.featureTitle}</PreviewKicker>
      <div style={{ display: "grid", gap: 14 }}>
        <StaggerChildren
          staggerInFrames={9}
          baseDelayInFrames={8}
          exitStaggerInFrames={6}
        >
          {rows.map((label, index) => (
            <SlideUp key={label} durationInFrames={22} distance={28} exit>
              <Row index={index} label={label} />
            </SlideUp>
          ))}
        </StaggerChildren>
      </div>
    </div>
  </PreviewFrame>
);
