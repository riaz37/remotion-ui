import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { componentReference } from "../lib/component-reference.ts";
import { REGISTRY_ATLAS } from "../registry/atlas.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const registryJsonPath = path.join(appRoot, "registry.json");
const outputDir = path.join(appRoot, "public", "r", "presets", "default");
const siteUrl = "https://remotionui.com";
const docsComponentsDir = path.join(appRoot, "content", "docs", "components");

const LIBRARY_SLUGS = new Set(["timing", "springs", "layout", "use-stagger"]);

/**
 * The same item JSON is served to two CLIs: ours, and shadcn's — the registry is
 * listed in shadcn's directory as `@remotionui`. shadcn resolves a bare
 * registry dependency against its own registry, so ours have to carry the
 * namespace, and it has no remotion-ui.json to read aliases from, so every file
 * has to carry an explicit target.
 */
const SHADCN_ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";
const REGISTRY_NAMESPACE = "@remotionui";

/**
 * Mirrors the default aliases in remotion-ui.json, so a shadcn install lands
 * where the `@/remotion/...` imports in the sources expect it. Our own CLI
 * still resolves the user's configured aliases first and only falls back here.
 */
const TARGET_DIRS: Array<{ segment: string; dir: string }> = [
  { segment: "/primitives/", dir: "src/remotion/primitives" },
  { segment: "/scenes/", dir: "src/remotion/scenes" },
  { segment: "/compositions/", dir: "src/compositions" },
  { segment: "/lib/", dir: "src/remotion/lib" },
  { segment: "/hooks/", dir: "src/remotion/hooks" },
];

function namespaceDependency(dep: string): string {
  if (dep.startsWith("@") || dep.startsWith("http")) return dep;
  return `${REGISTRY_NAMESPACE}/${dep}`;
}

function resolveFileTarget(file: RegistryFile): string | undefined {
  if (file.target) return file.target;

  for (const { segment, dir } of TARGET_DIRS) {
    const index = file.path.indexOf(segment);
    if (index !== -1) {
      return `${dir}/${file.path.slice(index + segment.length)}`;
    }
  }

  return undefined;
}

type DerivedCategory = "primitive" | "scene" | "composition" | "utility";

function deriveCategory(item: RegistryItem): DerivedCategory | undefined {
  if (
    LIBRARY_SLUGS.has(item.name) ||
    item.type === "registry:lib" ||
    item.type === "registry:hook"
  ) {
    return "utility";
  }

  const firstPath = item.files[0]?.path ?? "";
  if (firstPath.includes("/compositions/")) return "composition";
  if (firstPath.includes("/scenes/")) return "scene";
  if (item.type === "registry:ui" || firstPath.includes("/primitives/")) {
    return "primitive";
  }

  return undefined;
}

function assertCategoryAlignment(registry: Registry): void {
  const mismatches: string[] = [];

  for (const item of registry.items) {
    const reference = componentReference[item.name];
    if (!reference) continue;

    const derived = deriveCategory(item);
    if (derived && reference.category !== derived) {
      mismatches.push(
        `${item.name}: reference="${reference.category}" derived="${derived}"`,
      );
    }
  }

  if (mismatches.length > 0) {
    throw new Error(
      `component-reference category drift:\n${mismatches.join("\n")}`,
    );
  }
}

type RegistryFile = {
  path: string;
  type: string;
  target?: string;
};

type AtlasMeta = {
  lane: string;
  drive: string;
  tier: string;
  tags?: string[];
};

type CompatMeta = {
  remotion?: string;
};

type RegistryItem = {
  name: string;
  type: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  atlas?: AtlasMeta;
  compat?: CompatMeta;
  files: RegistryFile[];
};

type Registry = {
  name: string;
  homepage?: string;
  items: RegistryItem[];
};

async function readFileContent(relativePath: string): Promise<string | null> {
  const absolutePath = path.join(appRoot, relativePath);
  try {
    return await fs.readFile(absolutePath, "utf-8");
  } catch {
    console.warn(`  ⚠ Source file not found: ${relativePath}`);
    return null;
  }
}

function resolveAtlas(item: RegistryItem): AtlasMeta | undefined {
  return item.atlas ?? REGISTRY_ATLAS[item.name];
}

function getInstallTarget(item: RegistryItem, firstFile?: RegistryFile): string {
  if (firstFile?.target) return firstFile.target;
  if (item.type === "registry:lib") return `src/remotion/lib/${item.name}`;
  if (item.type === "registry:hook") return `src/remotion/hooks/${item.name}`;
  if (item.type === "registry:block") {
    return firstFile?.path.includes("/compositions/")
      ? `src/compositions/${item.name}`
      : `src/remotion/scenes/${item.name}`;
  }
  return `src/remotion/primitives/${item.name}`;
}

function getImportPath(item: RegistryItem, firstFile?: RegistryFile): string {
  if (item.type === "registry:block") {
    return firstFile?.path.includes("/compositions/")
      ? `@/compositions/${item.name}`
      : `@/remotion/scenes/${item.name}`;
  }
  if (item.type === "registry:lib") return `@/remotion/lib/${item.name}`;
  if (item.type === "registry:hook") return `@/remotion/hooks/${item.name}`;
  return `@/remotion/primitives/${item.name}`;
}

function getTasks(item: RegistryItem, atlas?: AtlasMeta): string[] {
  const text = `${item.name} ${item.description ?? ""} ${atlas?.tags?.join(" ") ?? ""}`;
  const tasks = new Set<string>();

  if (/caption|social|karaoke|clip/.test(text)) tasks.add("captions");
  if (/chart|metric|data|counter|stat|timeline/.test(text)) tasks.add("data");
  if (/audio|waveform|audiogram|podcast/.test(text)) tasks.add("audio");
  if (/transition|wipe|fade|slide|light-leak/.test(text)) tasks.add("transitions");
  if (/intro|showcase|title|feature|logo|end-card/.test(text)) tasks.add("product-intro");
  if (/lower|quote|callout|scene|card/.test(text)) tasks.add("scene-overlays");
  if (/map|spatial|route|markers/.test(text)) tasks.add("maps");
  if (item.type === "registry:block") tasks.add("scenes");
  if (atlas?.lane === "reels") tasks.add("reels");
  if (tasks.size === 0) tasks.add("motion-primitives");

  return Array.from(tasks);
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

async function buildAiFiles(registry: Registry): Promise<void> {
  const components = registry.items.map((item) => {
    const atlas = resolveAtlas(item);
    const firstFile = item.files[0];
    const reference = componentReference[item.name];

    const derivedCategory = deriveCategory(item);

    return {
      name: item.name,
      type: item.type,
      description: item.description,
      tasks: getTasks(item, atlas),
      atlas,
      dependencies: item.dependencies ?? [],
      registryDependencies: item.registryDependencies ?? [],
      installCommand: `npx remotion-ui@latest add ${item.name}`,
      docsUrl: `${siteUrl}/docs/components/${item.name}`,
      registryUrl: `${siteUrl}/r/presets/default/${item.name}.json`,
      detailUrl: `${siteUrl}/ai/components/${item.name}.json`,
      importPath: getImportPath(item, firstFile),
      installTarget: getInstallTarget(item, firstFile),
      ...(derivedCategory ? { category: derivedCategory } : {}),
      ...(reference
        ? {
            props: reference.props,
            usage: reference.usage,
            related: reference.related,
            note: reference.note,
          }
        : {}),
      ...(item.composition ? { composition: item.composition } : {}),
      ...(item.compat ? { compat: item.compat } : {}),
      aiRules: [
        "Install with the CLI before importing.",
        "Import from local source paths, not from the remotion-ui npm package.",
        "Customize the copied source file directly when design changes are needed.",
      ],
    };
  });

  const aiDir = path.join(appRoot, "public", "ai");
  const componentsDir = path.join(aiDir, "components");
  await fs.mkdir(componentsDir, { recursive: true });

  for (const component of components) {
    await writeJson(
      path.join(componentsDir, `${component.name}.json`),
      component,
    );
  }

  await writeJson(path.join(aiDir, "components.json"), {
    name: "remotionui-components",
    homepage: siteUrl,
    generatedFrom: "apps/web/registry.json",
    guidance:
      "Use Remotion for framework fundamentals. Use RemotionUI for source-installed video components.",
    components,
  });

  await fs.writeFile(
    path.join(aiDir, "remotionui-agent.md"),
    `# RemotionUI Agent Instructions

You are building Remotion videos with RemotionUI.

Remotion is the framework. RemotionUI is the component registry: production-ready motion, source you own.

## Hard rules

- Use Remotion docs for framework fundamentals: https://www.remotion.dev/docs
- Use RemotionUI for ready-made source components.
- Run \`npx remotion-ui@latest add <component>\` before importing a component.
- Import installed components from local paths such as \`@/remotion/primitives/...\`, \`@/remotion/scenes/...\`, and \`@/compositions/...\`.
- Do not import UI components from the \`remotion-ui\` npm package.
- Animate with \`useCurrentFrame()\`, \`interpolate()\`, \`spring()\`, and \`<Sequence />\`.
- Do not use CSS transitions or Tailwind animation classes for video motion.
- Customize copied source files directly when needed.

## Useful indexes

- Components: ${siteUrl}/ai/components.json
- Registry: ${siteUrl}/r/index.json
- Full LLM guide: ${siteUrl}/llms-full.txt

## Recommended workflow

1. Understand the user's video goal.
2. Find components in ${siteUrl}/ai/components.json.
3. Install components with \`npx remotion-ui@latest add ...\`.
4. Import from local source paths.
5. Compose scenes with Remotion frame APIs.
6. Keep text readable and inside safe areas.
7. Modify copied source files for brand, timing, layout, and props.
`,
    "utf-8",
  );

  console.log(`AI files built: public/ai/`);
}

/**
 * The sidebar is hand-curated: components live in category folder groups,
 * `content/docs/components/(<category>)/`, each with a meta.json. This only
 * checks the tree against the registry; it never writes meta.json.
 */
async function assertComponentDocs(registry: Registry): Promise<void> {
  const entries = await fs.readdir(docsComponentsDir, { withFileTypes: true });
  const errors: string[] = [];

  const loose = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
    .map((entry) => entry.name)
    .filter((name) => name !== "browse.mdx");
  if (loose.length > 0) {
    errors.push(`MDX outside a category group: ${loose.join(", ")}`);
  }

  const registryNames = new Set(registry.items.map((item) => item.name));
  let count = 0;

  for (const entry of entries) {
    const group = /^\((.+)\)$/.exec(entry.name)?.[1];
    if (!entry.isDirectory() || !group) continue;

    const dir = path.join(docsComponentsDir, entry.name);
    const meta = JSON.parse(
      await fs.readFile(path.join(dir, "meta.json"), "utf-8"),
    ) as { pages?: string[] };
    const listed = new Set(meta.pages ?? []);
    const slugs = (await fs.readdir(dir))
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => file.replace(/\.mdx$/, ""))
      .filter((slug) => slug !== group);

    for (const slug of slugs) {
      count += 1;
      if (!registryNames.has(slug)) {
        errors.push(`${entry.name}/${slug}.mdx has no registry entry`);
      }
      if (!listed.has(slug)) {
        errors.push(`${entry.name}/${slug}.mdx is missing from its meta.json`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Component docs out of sync:\n${errors.join("\n")}`);
  }
  console.log(`  ✓ component docs (${count} pages in category groups)`);
}

async function buildRegistry(): Promise<void> {
  console.log("Building registry...");

  const registryRaw = await fs.readFile(registryJsonPath, "utf-8");
  const registry: Registry = JSON.parse(registryRaw);

  await fs.mkdir(outputDir, { recursive: true });


  const index: Array<{
    name: string;
    type: string;
    description?: string;
    atlas?: AtlasMeta;
  }> = [];

  for (const item of registry.items) {
    const atlas = resolveAtlas(item);
    const filesWithContent = [];

    for (const file of item.files) {
      const content = await readFileContent(file.path);
      const target = resolveFileTarget(file);
      filesWithContent.push({
        ...file,
        ...(target ? { target } : {}),
        ...(content !== null ? { content } : {}),
      });
    }

    const output = {
      $schema: SHADCN_ITEM_SCHEMA,
      ...item,
      ...(item.registryDependencies?.length
        ? {
            registryDependencies:
              item.registryDependencies.map(namespaceDependency),
          }
        : {}),
      ...(atlas ? { atlas } : {}),
      files: filesWithContent,
    };

    const outputPath = path.join(outputDir, `${item.name}.json`);
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2), "utf-8");
    console.log(`  ✓ ${item.name}.json`);

    index.push({
      name: item.name,
      type: item.type,
      description: item.description,
      ...(atlas ? { atlas } : {}),
    });
  }

  const indexPath = path.join(appRoot, "public", "r", "index.json");
  await fs.mkdir(path.dirname(indexPath), { recursive: true });
  await fs.writeFile(
    indexPath,
    JSON.stringify(
      {
        name: registry.name,
        homepage: registry.homepage,
        items: index,
      },
      null,
      2,
    ),
    "utf-8",
  );

  console.log(`\nRegistry built: ${registry.items.length} item(s)`);
  console.log(`Output: public/r/`);

  await assertComponentDocs(registry);
  assertCategoryAlignment(registry);
  await buildAiFiles(registry);
}

buildRegistry().catch((error) => {
  console.error("Registry build failed:", error);
  process.exit(1);
});
