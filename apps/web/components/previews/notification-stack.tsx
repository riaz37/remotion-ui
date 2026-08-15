"use client";

import { AbsoluteFill } from "remotion";
import { NotificationStack } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/** Stand-in for the app the toasts are sitting over. */
const AppBackdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(circle at 26% 34%, rgba(125,211,232,0.13), transparent 38%), linear-gradient(140deg, #0a0d16 0%, #14161f 54%, #06070b 100%)",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: "7%",
        top: "16%",
        width: "34%",
        height: 18,
        borderRadius: 999,
        background: "rgba(255,255,255,0.42)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "7%",
        top: "27%",
        width: "22%",
        height: 12,
        borderRadius: 999,
        background: "rgba(255,255,255,0.16)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "7%",
        top: "40%",
        width: "38%",
        height: "38%",
        borderRadius: 20,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    />
  </AbsoluteFill>
);

/**
 * No exit is scheduled: arrivals and dismissals overlap for the whole window
 * and every toast's progress line is draining, so frames 18 / 60 / 108 differ
 * even when nothing is entering or leaving. See
 * docs-internal/preview-audit-rubric.md.
 */
export const NotificationStackPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <AppBackdrop />
    <NotificationStack />
  </ScenePreviewPlate>
);
