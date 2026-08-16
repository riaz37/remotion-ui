"use client";

import { MultiDeviceLineup } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/** One responsive layout, laying itself out at whatever width it is given. */
const ResponsiveScreen: React.FC = () => (
  <div
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      padding: 12,
      background:
        "radial-gradient(120% 80% at 20% 0%, rgba(232,184,109,0.20), transparent 58%), #0B0C11",
      fontFamily: "system-ui, sans-serif",
    }}
  >
    <div style={{ color: "#D8DCE4", fontSize: 13, fontWeight: 700 }}>Northstar</div>
    <div
      style={{
        height: 46,
        borderRadius: 8,
        background: "rgba(232,184,109,0.16)",
        border: "1px solid rgba(232,184,109,0.35)",
      }}
    />
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {[0, 1, 2, 3].map((tile) => (
        <div
          key={tile}
          style={{
            flex: "1 1 64px",
            height: 34,
            borderRadius: 6,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
      ))}
    </div>
    <div style={{ height: 8, width: "70%", borderRadius: 99, background: "rgba(255,255,255,0.14)" }} />
    <div style={{ height: 8, width: "48%", borderRadius: 99, background: "rgba(255,255,255,0.09)" }} />
  </div>
);

/**
 * Devices land 9 frames apart from frame 4, so frame 18 catches the tablet and
 * laptop still rising; the exit at frame 92 covers frame 108. See
 * docs-internal/preview-audit-rubric.md.
 */
export const MultiDeviceLineupPreview: React.FC = () => (
  <PreviewFrame lane="spatial">
    <MultiDeviceLineup
      scale={0.72}
      delayInFrames={4}
      staggerInFrames={14}
      exitAtInFrames={92}
      phone={{ label: "Phone" }}
      tablet={{ label: "Tablet" }}
      laptop={{ label: "Laptop" }}
    >
      <ResponsiveScreen />
    </MultiDeviceLineup>
  </PreviewFrame>
);
