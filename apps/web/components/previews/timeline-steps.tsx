"use client";

import { TimelineSteps } from "../registry-exports";

export const TimelineStepsPreview: React.FC = () => (
  <TimelineSteps
    title="From raw to render"
    steps={[
      { title: "Record", description: "Capture the source." },
      { title: "Mark", description: "Find the key beat." },
      { title: "Compose", description: "Add scenes." },
      { title: "Render", description: "Ship the clip." },
    ]}
  />
);
