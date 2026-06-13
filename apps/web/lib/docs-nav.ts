import type * as PageTree from "fumadocs-core/page-tree";
import { ATLAS_LANES, getItemsByLane, type AtlasLane } from "./atlas";
import { getComponentDocPath } from "./component-doc-path";
import { source } from "./source";

export type ComponentLink = {
  name: string;
  slug: string;
  url: string;
  description?: string;
  tier?: "core" | "advanced";
  lane?: AtlasLane;
};

export type ComponentSection = {
  title: string;
  basePath: string;
  items: ComponentLink[];
  lane?: AtlasLane;
};

function isFolder(node: PageTree.Node): node is PageTree.Folder {
  return node.type === "folder";
}

function folderChildren(folder: PageTree.Folder): ComponentLink[] {
  return folder.children
    .filter((node): node is PageTree.Item => node.type === "page")
    .map((page) => ({
      name: typeof page.name === "string" ? page.name : String(page.name),
      slug: page.url.split("/").pop() ?? page.url,
      url: page.url,
      description:
        typeof page.description === "string" ? page.description : undefined,
    }));
}

const sectionFolders = [
  "primitives",
  "signals",
  "spatial",
  "vectors",
  "cuts",
  "scenes",
  "compositions",
] as const;

export function getComponentSections(): ComponentSection[] {
  const sections: ComponentSection[] = [];

  for (const child of source.pageTree.children) {
    if (!isFolder(child)) continue;
    const folderLabel =
      typeof child.name === "string" ? child.name : String(child.index ?? "");
    const folderName = folderLabel.toLowerCase();
    if (
      !sectionFolders.includes(
        folderName as (typeof sectionFolders)[number],
      )
    ) {
      continue;
    }

    sections.push({
      title: folderLabel,
      basePath: `/docs/${folderName}`,
      items: folderChildren(child),
    });
  }

  return sections;
}

export function getAtlasSections(): ComponentSection[] {
  const lanes = Object.keys(ATLAS_LANES) as AtlasLane[];
  const sections: ComponentSection[] = [];

  for (const lane of lanes) {
    const items = getItemsByLane(lane);
    if (items.length === 0) continue;

    const meta = ATLAS_LANES[lane];
    sections.push({
      title: meta.label,
      basePath: `/docs/atlas/${lane}`,
      lane,
      items: items.map((name) => ({
        name,
        slug: name,
        url: getComponentDocPath(name),
        lane,
      })),
    });
  }

  return sections;
}
