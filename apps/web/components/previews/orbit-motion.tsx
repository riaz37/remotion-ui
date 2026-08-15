"use client";

import { OrbitMotion } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const SATELLITES = ["Scenes", "Atoms", "Cuts", "Blocks"];

const Chip: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      padding: "16px 28px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.16)",
      color: "#ececec",
      fontSize: 28,
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </div>
);

const Hub: React.FC = () => (
  <div
    style={{
      width: 168,
      height: 168,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      background: "rgba(232,184,109,0.14)",
      border: "1px solid rgba(232,184,109,0.5)",
      color: "#e8b86d",
      fontSize: 30,
      fontWeight: 600,
    }}
  >
    Registry
  </div>
);

/**
 * A 70-frame revolution. Four evenly spaced satellites would repeat every
 * quarter turn — 17.5 frames — which is the number the audit's 42 and 48-frame
 * gaps would have to miss, so the satellites carry different labels. Naming
 * them removes the rotational symmetry entirely and the three samples cannot
 * read as the same frame.
 */
export const OrbitMotionPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <OrbitMotion
      periodInFrames={70}
      radiusX={288}
      radiusY={104}
      tilt={-14}
      depth={0.3}
      depthFade={0.42}
      showPath
      center={<Hub />}
    >
      {SATELLITES.map((label) => (
        <Chip key={label} label={label} />
      ))}
    </OrbitMotion>
  </PreviewFrame>
);
