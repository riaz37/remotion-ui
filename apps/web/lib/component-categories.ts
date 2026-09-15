import type * as PageTree from "fumadocs-core/page-tree";

/**
 * Component categories are fumadocs folder groups:
 * `content/docs/components/(<category>)/`, each with a landing page named
 * `<category>.mdx` set as `pagesIndex`. The parentheses keep the group out of
 * the URL, so components stay at `/docs/components/<slug>` and the landing
 * page lives at `/docs/components/<category>`.
 *
 * The root meta.json extracts the components folder (`...components`), so the
 * groups sit at the top of the tree; lookups walk the whole tree by folder path
 * instead of assuming a parent "Components" node.
 */
export type CategoryItem = {
  title: string;
  slug: string;
  url: string;
  description?: string;
};

export type ComponentCategory = {
  slug: string;
  title: string;
  url: string;
  items: CategoryItem[];
};

const GROUP_FOLDER = /^components\/\(([^)/]+)\)$/;

function nodeText(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function slugFromUrl(url: string): string {
  return url.split("/").pop() ?? url;
}

function toCategory(folder: PageTree.Folder): ComponentCategory | null {
  const match = GROUP_FOLDER.exec(folder.$ref?.folder ?? "");
  if (!match || !folder.index) return null;

  const items = folder.children
    .filter((node): node is PageTree.Item => node.type === "page")
    .map((page) => ({
      title: nodeText(page.name),
      slug: slugFromUrl(page.url),
      url: page.url,
      description:
        typeof page.description === "string" ? page.description : undefined,
    }));

  return {
    slug: match[1],
    title: nodeText(folder.name),
    url: folder.index.url,
    items,
  };
}

function collectFolders(nodes: PageTree.Node[]): PageTree.Folder[] {
  return nodes.flatMap((node) =>
    node.type === "folder" ? [node, ...collectFolders(node.children)] : [],
  );
}

export function getComponentCategories(
  root: PageTree.Root,
): ComponentCategory[] {
  return collectFolders(root.children)
    .map(toCategory)
    .filter((category): category is ComponentCategory => category !== null);
}

export function getComponentCategory(
  root: PageTree.Root,
  slug: string,
): ComponentCategory | undefined {
  return getComponentCategories(root).find((category) => category.slug === slug);
}
