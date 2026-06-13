"use client";

import { CursorPath } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

export const CursorPathPreview: React.FC = () => (
  <PreviewFrame lane="vectors">
    <div style={{ position: "relative", width: 720, height: 320 }}>
      <CursorPath
        points={[
          { x: 80, y: 250 },
          { x: 220, y: 90 },
          { x: 480, y: 130 },
          { x: 640, y: 60 },
        ]}
      />
    </div>
  </PreviewFrame>
);
