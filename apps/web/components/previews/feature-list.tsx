"use client";

import { FeatureList } from "../registry-exports";

export const FeatureListPreview: React.FC = () => (
  <FeatureList
    title="Built for developers"
    items={["Source you own", "Registry CLI", "Live previews"]}
  />
);
