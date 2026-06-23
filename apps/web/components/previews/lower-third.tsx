"use client";

import { AbsoluteFill } from "remotion";
import { LowerThird } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

const PreviewBackdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(circle at 74% 30%, rgba(232,184,109,0.18), transparent 30%), linear-gradient(135deg, #0b1020 0%, #141824 48%, #070810 100%)",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: "8%",
        top: "12%",
        width: "48%",
        height: "56%",
        borderRadius: 28,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 26px 70px rgba(0,0,0,0.28)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "11%",
        top: "18%",
        width: "30%",
        height: 20,
        borderRadius: 999,
        background: "rgba(255,255,255,0.58)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "11%",
        top: "27%",
        width: "22%",
        height: 14,
        borderRadius: 999,
        background: "#e8b86d",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "11%",
        top: "40%",
        width: "36%",
        height: "17%",
        borderRadius: 22,
        background: "rgba(5,7,15,0.42)",
      }}
    />
    <div
      style={{
        position: "absolute",
        right: "14%",
        top: "13%",
        width: "22%",
        aspectRatio: "1",
        borderRadius: "50%",
        background:
          "linear-gradient(180deg, rgba(232,184,109,0.42), rgba(244,114,182,0.18))",
        boxShadow: "0 30px 70px rgba(0,0,0,0.24)",
      }}
    />
    <div
      style={{
        position: "absolute",
        right: "18%",
        top: "54%",
        width: "17%",
        height: "15%",
        borderRadius: 24,
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    />
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(to top, rgba(5,7,15,0.68) 0%, transparent 46%)",
      }}
    />
  </AbsoluteFill>
);

export const LowerThirdPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <PreviewBackdrop />
    <LowerThird title="Mina Patel" subtitle="Founder, Northstar Studio" />
  </ScenePreviewPlate>
);
