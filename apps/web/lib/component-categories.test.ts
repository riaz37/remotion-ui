import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type * as PageTree from "fumadocs-core/page-tree";
import { describe, expect, it } from "vitest";
import { getComponentCategories, getComponentCategory } from "./component-categories";

/**
 * Category landing pages live at /docs/components/<category>, the same URL
 * space as components (/docs/components/<slug>). These checks read the content
 * tree directly so a clash fails CI before fumadocs silently shadows a page.
 */
const WEB = join(__dirname, "..");
const COMPONENTS_DIR = join(WEB, "content/docs/components");
const GROUP = /^\((.+)\)$/;

type GroupMeta = { title?: string; pagesIndex?: string; pages?: string[] };

const groupDirs = readdirSync(COMPONENTS_DIR).filter(
  (name) =>
    GROUP.test(name) && statSync(join(COMPONENTS_DIR, name)).isDirectory(),
);

function readMeta(dir: string): GroupMeta {
  return JSON.parse(
    readFileSync(join(COMPONENTS_DIR, dir, "meta.json"), "utf8"),
  ) as GroupMeta;
}

function mdxSlugs(dir: string): string[] {
  return readdirSync(join(COMPONENTS_DIR, dir))
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.slice(0, -".mdx".length));
}

const categories = groupDirs.map((dir) => ({
  dir,
  slug: GROUP.exec(dir)![1],
  meta: readMeta(dir),
}));

const componentSlugs = new Set<string>([
  ...readdirSync(COMPONENTS_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.slice(0, -".mdx".length)),
  ...categories.flatMap(({ dir, slug }) =>
    mdxSlugs(dir).filter((name) => name !== slug),
  ),
]);

const registrySlugs = (
  JSON.parse(readFileSync(join(WEB, "registry.json"), "utf8")) as {
    items: { name: string }[];
  }
).items.map((item) => item.name);

describe("getComponentCategories", () => {
  const page = (slug: string, name = slug): PageTree.Item => ({
    type: "page",
    name,
    url: `/docs/components/${slug}`,
  });
  const tree: PageTree.Root = {
    type: "root",
    name: "Docs",
    children: [
      page("browse", "All components"),
      {
        type: "folder",
        name: "Text effects",
        index: page("text-effects", "Text effects"),
        children: [page("typewriter", "Typewriter"), page("counter", "Counter")],
        $ref: { folder: "components/(text-effects)" },
      },
      {
        type: "folder",
        name: "Guides",
        children: [page("maps")],
        $ref: { folder: "guides" },
      },
    ],
  };

  it("finds groups at the tree root after `...components` extraction", () => {
    expect(getComponentCategories(tree)).toEqual([
      {
        slug: "text-effects",
        title: "Text effects",
        url: "/docs/components/text-effects",
        items: [
          { title: "Typewriter", slug: "typewriter", url: "/docs/components/typewriter", description: undefined },
          { title: "Counter", slug: "counter", url: "/docs/components/counter", description: undefined },
        ],
      },
    ]);
  });

  it("returns undefined for an unknown category", () => {
    expect(getComponentCategory(tree, "guides")).toBeUndefined();
  });
});

describe("component categories", () => {
  it("has folder groups", () => {
    expect(categories.length).toBeGreaterThan(0);
  });

  it.each(categories)("$slug uses its own landing page as index", ({ dir, slug, meta }) => {
    expect(meta.pagesIndex).toBe(slug);
    expect(meta.title).toBeTruthy();
    expect(existsSync(join(COMPONENTS_DIR, dir, `${slug}.mdx`))).toBe(true);
  });

  it("no component doc sits loose at the components root (it would miss the sidebar)", () => {
    const loose = readdirSync(COMPONENTS_DIR).filter(
      (file) => file.endsWith(".mdx") && file !== "browse.mdx",
    );
    expect(loose).toEqual([]);
  });

  it("no category slug equals a component doc slug", () => {
    const clashes = categories.filter(({ slug }) => componentSlugs.has(slug));
    expect(clashes.map(({ slug }) => slug)).toEqual([]);
  });

  it("no category slug equals a registry item name", () => {
    const clashes = categories.filter(({ slug }) =>
      registrySlugs.includes(slug),
    );
    expect(clashes.map(({ slug }) => slug)).toEqual([]);
  });

  it("every component doc sits in exactly one group listed in the parent meta", () => {
    const parent = JSON.parse(
      readFileSync(join(COMPONENTS_DIR, "meta.json"), "utf8"),
    ) as GroupMeta;
    expect([...(parent.pages ?? [])].sort()).toEqual([...groupDirs].sort());

    const seen = new Map<string, string>();
    for (const { dir, slug, meta } of categories) {
      for (const page of mdxSlugs(dir).filter((name) => name !== slug)) {
        expect(seen.get(page), `${page} is in two groups`).toBeUndefined();
        seen.set(page, dir);
        expect(meta.pages ?? [], `${page} missing from ${dir}/meta.json`).toContain(page);
      }
    }
  });
});
