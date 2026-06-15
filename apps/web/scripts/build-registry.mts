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
const componentsMetaPath = path.join(docsComponentsDir, "meta.json");

const LANE_ORDER = [
  "atoms",
  "signals",
  "vectors",
  "spatial",
  "blocks",
  "cuts",
  "reels",
] as const;

const LIBRARY_SLUGS = new Set(["timing", "springs", "layout", "use-stagger"]);

/** Plain-language sidebar group labels (Atlas lane names are internal). */
const LANE_SIDEBAR_GROUP: Record<(typeof LANE_ORDER)[number], string> = {
  atoms: "Motion primitives",
  signals: "Captions & media",
  vectors: "SVG & paths",
  spatial: "Maps",
  blocks: "Scenes",
  cuts: "Transitions",
  reels: "Templates",
};

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

type RegistryItem = {
  name: string;
  type: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  atlas?: AtlasMeta;
  files: RegistryFile[];
};

type Registry = {
  name: string;
  homepage?: string;
  items: RegistryItem[];
};

type AiRecipe = {
  slug: string;
  title: string;
  intent: string;
  components: string[];
  installCommand: string;
  docsUrl: string;
  prompt: string;
  flagshipComposition?: string;
  compositionId?: string;
  renderCommand?: string;
};

type RecipeManifest = {
  recipes: AiRecipe[];
};

async function loadRecipes(): Promise<AiRecipe[]> {
  const manifestPath = path.join(
    appRoot,
    "content",
    "docs",
    "recipes",
    "manifest.json",
  );
  const raw = await fs.readFile(manifestPath, "utf-8");
  const manifest = JSON.parse(raw) as RecipeManifest;
  return manifest.recipes;
}

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
  const recipes = await loadRecipes();
  const components = registry.items.map((item) => {
    const atlas = resolveAtlas(item);
    const firstFile = item.files[0];
    const reference = componentReference[item.name];

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
      ...(reference
        ? {
            props: reference.props,
            usage: reference.usage,
            related: reference.related,
            note: reference.note,
            category: reference.category,
          }
        : {}),
      ...(item.composition ? { composition: item.composition } : {}),
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

  await writeJson(path.join(aiDir, "recipes.json"), {
    name: "remotionui-recipes",
    homepage: siteUrl,
    guidance:
      "Choose a recipe first when the user asks for a complete video. Install all listed components before importing.",
    recipes,
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
- Recipes: ${siteUrl}/ai/recipes.json
- Registry: ${siteUrl}/r/index.json
- Full LLM guide: ${siteUrl}/llms-full.txt

## Recommended workflow

1. Understand the user's video goal.
2. Choose a recipe from ${siteUrl}/ai/recipes.json.
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

async function writeLlmsTxt(registry: Registry, recipes: AiRecipe[]): Promise<void> {
  const compositions = registry.items
    .filter((item) => item.type === "registry:block" && item.files[0]?.path.includes("/compositions/"))
    .map((item) => item.name);

  const recipeLines = recipes
    .map(
      (recipe) =>
        `- ${recipe.title} (\`${recipe.slug}\`): ${recipe.installCommand}`,
    )
    .join("\n");

  const compositionLines = compositions
    .slice(0, 12)
    .map((name) => `- ${name}`)
    .join("\n");

  const llmsTxt = `# RemotionUI

> Production-ready motion for Remotion. Source you own. The npm package is a CLI; components install as editable source in the user's project.

## Canonical URLs

- Site: ${siteUrl}
- Docs: ${siteUrl}/docs
- Component catalog: ${siteUrl}/docs/components
- AI guide: ${siteUrl}/docs/ai
- Full LLM guide: ${siteUrl}/llms-full.txt
- Component index: ${siteUrl}/ai/components.json
- Recipe index: ${siteUrl}/ai/recipes.json
- Agent prompt: ${siteUrl}/ai/remotionui-agent.md
- Registry: ${siteUrl}/r/index.json

## Use RemotionUI for

- Animated captions and social clips
- Counters, metrics, charts, and data stories
- Lower thirds, title cards, quote cards, and callouts
- Audio visualizers and podcast clips
- Transitions, intros, showcases, and reel templates

## Recipes (${recipes.length})

${recipeLines}

## Flagship compositions

${compositionLines}

## CLI

\`\`\`bash
npx remotion-ui@latest init my-video
cd my-video
npx remotion-ui@latest search -q caption
npx remotion-ui@latest add social-clip caption-highlight lower-third
\`\`\`

## Agent rules

- Use Remotion docs for framework fundamentals: https://www.remotion.dev/docs
- Use RemotionUI for source-installed components.
- Run \`npx remotion-ui@latest add <component>\` before importing.
- Import from local source paths, not from \`remotion-ui\`.
- Animate with Remotion frame APIs, not CSS transitions.
`;

  await fs.writeFile(path.join(appRoot, "public", "llms.txt"), llmsTxt, "utf-8");
  console.log("llms.txt generated: public/llms.txt");
}

async function buildComponentsMeta(registry: Registry): Promise<void> {
  const entries = await fs.readdir(docsComponentsDir);
  const mdxSlugs = entries
    .filter(
      (file) => file.endsWith(".mdx") && file !== "browse.mdx",
    )
    .map((file) => file.replace(/\.mdx$/, ""))
    .sort();

  const registryNames = new Set(registry.items.map((item) => item.name));
  const orphans = mdxSlugs.filter((slug) => !registryNames.has(slug));
  if (orphans.length > 0) {
    throw new Error(
      `Component MDX without registry entry: ${orphans.join(", ")}`,
    );
  }

  const pages: string[] = [];

  for (const lane of LANE_ORDER) {
    const laneSlugs = mdxSlugs
      .filter(
        (slug) =>
          !LIBRARY_SLUGS.has(slug) && REGISTRY_ATLAS[slug]?.lane === lane,
      )
      .sort();

    if (laneSlugs.length === 0) continue;
    pages.push(`---${LANE_SIDEBAR_GROUP[lane]}---`);
    pages.push(...laneSlugs);
  }

  const librarySlugs = mdxSlugs.filter((slug) => LIBRARY_SLUGS.has(slug)).sort();
  if (librarySlugs.length > 0) {
    pages.push("---Helpers---");
    pages.push(...librarySlugs);
  }

  const inMeta = new Set(pages.filter((entry) => !entry.startsWith("---")));
  const missingFromMeta = mdxSlugs.filter((slug) => !inMeta.has(slug));
  if (missingFromMeta.length > 0) {
    throw new Error(
      `Component MDX not assigned to sidebar meta: ${missingFromMeta.join(", ")}`,
    );
  }

  await writeJson(componentsMetaPath, {
    title: "Components",
    pagesIndex: "browse",
    pages,
  });
  console.log(`  ✓ components/meta.json (${mdxSlugs.length} items)`);
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
      filesWithContent.push({
        ...file,
        ...(content !== null ? { content } : {}),
      });
    }

    const output = {
      ...item,
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

  await buildComponentsMeta(registry);
  await buildAiFiles(registry);
  const recipes = await loadRecipes();
  await writeLlmsTxt(registry, recipes);
}

buildRegistry().catch((error) => {
  console.error("Registry build failed:", error);
  process.exit(1);
});
