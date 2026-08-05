"use client";

import { SimulatedCursor } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";
import { DEMO_PALETTE } from "@/lib/demo-assets";
import { PREVIEW_DEFAULTS } from "@/lib/preview-config";

/**
 * The cursor needs something to click, so the preview draws a panel and routes
 * the pointer onto its controls — a bare cursor over an empty stage reads as
 * nothing happening. Geometry is explicit so the cursor's waypoints can be
 * derived from the targets instead of eyeballed.
 */
const PANEL = { left: 170, top: 132, width: 620, padding: 40 } as const;
const CHIP = { width: 118, height: 58, gap: 14 } as const;
const BUTTON = { width: 200, height: 70 } as const;

const LABEL_ROW_HEIGHT = 34;
const ROW_GAP = 26;

const chipsTop = PANEL.top + PANEL.padding + LABEL_ROW_HEIGHT + ROW_GAP;
const buttonTop = chipsTop + CHIP.height + ROW_GAP;

const chipCenter = (index: number) => ({
  x: PANEL.left + PANEL.padding + index * (CHIP.width + CHIP.gap) + CHIP.width / 2,
  y: chipsTop + CHIP.height / 2,
});
const buttonCenter = {
  x: PANEL.left + PANEL.padding + BUTTON.width / 2,
  y: buttonTop + BUTTON.height / 2,
};

const asPercent = (point: { x: number; y: number }) => ({
  x: (point.x / PREVIEW_DEFAULTS.width) * 100,
  y: (point.y / PREVIEW_DEFAULTS.height) * 100,
});

const OPTIONS = ["720p", "1080p", "4K"];

export const SimulatedCursorPreview: React.FC = () => {
  const tokens = usePreviewStage();

  return (
    <PreviewFrame lane="vectors" padding={0}>
      <div
        style={{
          position: "absolute",
          left: PANEL.left,
          top: PANEL.top,
          width: PANEL.width,
          display: "grid",
          gap: ROW_GAP,
          padding: PANEL.padding,
          borderRadius: 10,
          background: tokens.panelFill,
          border: `1px solid ${tokens.panelBorder}`,
        }}
      >
        <div
          style={{
            height: LABEL_ROW_HEIGHT,
            color: tokens.muted,
            fontSize: 26,
            fontWeight: 500,
          }}
        >
          Export preset
        </div>
        <div style={{ display: "flex", gap: CHIP.gap }}>
          {OPTIONS.map((option, index) => (
            <div
              key={option}
              style={{
                width: CHIP.width,
                height: CHIP.height,
                display: "grid",
                placeItems: "center",
                borderRadius: 8,
                fontSize: 26,
                fontWeight: 500,
                color: index === 1 ? tokens.ink : tokens.muted,
                background:
                  index === 1 ? "rgba(255,255,255,0.08)" : "transparent",
                border: `1px solid ${tokens.panelBorder}`,
              }}
            >
              {option}
            </div>
          ))}
        </div>
        <div
          style={{
            width: BUTTON.width,
            height: BUTTON.height,
            display: "grid",
            placeItems: "center",
            borderRadius: 8,
            background: DEMO_PALETTE.phosphor,
            color: "#101014",
            fontSize: 28,
            fontWeight: 600,
          }}
        >
          Render
        </div>
      </div>

      <SimulatedCursor
        points={[
          { ...asPercent({ x: 700, y: 470 }), frame: 0 },
          { ...asPercent(chipCenter(1)), frame: 26, label: "1080p" },
          {
            ...asPercent(buttonCenter),
            frame: 54,
            target: 104,
            label: "Render",
          },
        ]}
        clickFrames={[28, 58]}
        size={34}
      />
    </PreviewFrame>
  );
};
