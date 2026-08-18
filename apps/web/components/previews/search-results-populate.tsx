"use client";

import { SearchResultsPopulate } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * Frame 18 catches the query typing, frame 60 the results still streaming in
 * ahead of the re-rank at 2.7s, and `holdSeconds={3.27}` puts frame 108 mid-exit
 * rather than on a settled list. See docs-internal/preview-audit-rubric.md.
 */
export const SearchResultsPopulatePreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <SearchResultsPopulate holdSeconds={3.27} />
  </ScenePreviewPlate>
);
