import { getAtlasMeta, type AtlasLane } from "@/lib/atlas";
import { getComponentReference } from "@/lib/component-reference";

const LANE_DOC_SECTION: Partial<Record<AtlasLane, string>> = {
  atoms: "primitives",
  signals: "signals",
  vectors: "vectors",
  spatial: "spatial",
  blocks: "scenes",
  cuts: "cuts",
  reels: "compositions",
};

/** Docs folder overrides when atlas lane and MDX location disagree. */
const DOC_SECTION_OVERRIDES: Record<string, string> = {
  "logo-reveal": "scenes",
};

export function getComponentDocPath(name: string): string {
  const override = DOC_SECTION_OVERRIDES[name];
  if (override) return `/docs/${override}/${name}`;

  const atlas = getAtlasMeta(name);
  if (atlas?.lane && LANE_DOC_SECTION[atlas.lane]) {
    return `/docs/${LANE_DOC_SECTION[atlas.lane]}/${name}`;
  }

  const reference = getComponentReference(name);
  if (reference?.category === "composition") {
    return `/docs/compositions/${name}`;
  }
  if (reference?.category === "scene") {
    return `/docs/scenes/${name}`;
  }
  if (reference?.category === "utility") {
    return `/docs/utilities/${name}`;
  }

  return `/docs/primitives/${name}`;
}

export function getComponentDocSection(name: string): string {
  return getComponentDocPath(name).split("/")[2] ?? "primitives";
}
