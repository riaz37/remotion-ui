"use client";

import { SplitScreen } from "../registry-exports";
import { DEMO_MEDIA_ALT_SRC, DEMO_MEDIA_SRC } from "@/lib/demo-assets";

export const SplitScreenPreview: React.FC = () => (
  <SplitScreen
    title="before and after"
    left={{ src: DEMO_MEDIA_SRC, label: "Before" }}
    right={{ src: DEMO_MEDIA_ALT_SRC, label: "After" }}
  />
);
