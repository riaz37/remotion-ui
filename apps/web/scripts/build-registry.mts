import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REGISTRY_ATLAS } from "../registry/atlas.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const registryJsonPath = path.join(appRoot, "registry.json");
const outputDir = path.join(appRoot, "public", "r", "presets", "default");
const siteUrl = "https://remotionui.com";

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
};

const AI_RECIPES: AiRecipe[] = [
  {
    slug: "captioned-social-video",
    title: "Captioned social video",
    intent: "Build a vertical short-form video with hook text, synced captions, audio visuals, and CTA.",
    components: [
      "social-clip",
      "caption-scene",
      "caption-highlight",
      "audiogram-scene",
      "end-card",
    ],
    installCommand:
      "npx remotion-ui@latest add social-clip caption-scene caption-highlight audiogram-scene end-card",
    docsUrl: `${siteUrl}/docs/ai/recipes/captioned-social-video`,
    prompt:
      "Create a 9:16 captioned social clip using RemotionUI. Install the components first, import them from local source paths, and use Remotion Caption[] data for synced captions.",
  },
  {
    slug: "data-story",
    title: "Data story",
    intent: "Build a chart-led explainer video with animated metrics and timeline context.",
    components: [
      "data-story",
      "animated-bar-chart",
      "metric-ticker",
      "timeline-steps",
      "caption-bumper",
    ],
    installCommand:
      "npx remotion-ui@latest add data-story animated-bar-chart metric-ticker timeline-steps caption-bumper",
    docsUrl: `${siteUrl}/docs/ai/recipes/data-story`,
    prompt:
      "Create a data-story Remotion video using RemotionUI. Convert the user's data into typed arrays and keep each scene focused on one readable insight.",
  },
  {
    slug: "podcast-clip",
    title: "Podcast clip",
    intent: "Build an audio-first clip with waveform visuals and synced captions.",
    components: [
      "podcast-clip",
      "audio-pulse",
      "waveform-line",
      "audiogram-scene",
      "caption-scene",
    ],
    installCommand:
      "npx remotion-ui@latest add podcast-clip audio-pulse waveform-line audiogram-scene caption-scene",
    docsUrl: `${siteUrl}/docs/ai/recipes/podcast-clip`,
    prompt:
      "Create a podcast clip using RemotionUI. Ask for an audio source and captions, then use audio visuals and safe-area captions.",
  },
  {
    slug: "product-intro",
    title: "Product intro",
    intent: "Build a polished product intro or feature showcase.",
    components: [
      "intro",
      "showcase",
      "title-card",
      "feature-list",
      "logo-reveal",
      "end-card",
    ],
    installCommand:
      "npx remotion-ui@latest add intro showcase title-card feature-list logo-reveal end-card",
    docsUrl: `${siteUrl}/docs/ai/recipes/product-intro`,
    prompt:
      "Create a product intro using RemotionUI. Start with a short headline, reveal the product or logo, show key features, and end with a CTA.",
  },
  {
    slug: "lower-third-scene",
    title: "Lower-third scene",
    intent: "Build a lower third, speaker label, title card, stat card, or quote overlay.",
    components: [
      "lower-third",
      "title-card",
      "stat-card",
      "quote-card",
      "callout-spotlight",
    ],
    installCommand:
      "npx remotion-ui@latest add lower-third title-card stat-card quote-card callout-spotlight",
    docsUrl: `${siteUrl}/docs/ai/recipes/lower-third-scene`,
    prompt:
      "Create a reusable scene overlay using RemotionUI. Reserve layout slots and keep text readable instead of manually stacking elements.",
  },
];

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

function getDocsCategory(item: RegistryItem, atlas?: AtlasMeta): string {
  if (atlas?.lane === "signals") return "signals";
  if (atlas?.lane === "spatial") return "spatial";
  if (atlas?.lane === "vectors") return "vectors";
  if (atlas?.lane === "cuts") return "cuts";
  if (item.type === "registry:block") {
    return atlas?.lane === "reels" ? "compositions" : "scenes";
  }
  if (item.type === "registry:lib" || item.type === "registry:hook") {
    return "utilities";
  }
  return "primitives";
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
    const docsCategory = getDocsCategory(item, atlas);

    return {
      name: item.name,
      type: item.type,
      description: item.description,
      tasks: getTasks(item, atlas),
      atlas,
      dependencies: item.dependencies ?? [],
      registryDependencies: item.registryDependencies ?? [],
      installCommand: `npx remotion-ui@latest add ${item.name}`,
      docsUrl: `${siteUrl}/docs/${docsCategory}/${item.name}`,
      registryUrl: `${siteUrl}/r/presets/default/${item.name}.json`,
      importPath: getImportPath(item, firstFile),
      installTarget: getInstallTarget(item, firstFile),
      aiRules: [
        "Install with the CLI before importing.",
        "Import from local source paths, not from the remotion-ui npm package.",
        "Customize the copied source file directly when design changes are needed.",
      ],
    };
  });

  const aiDir = path.join(appRoot, "public", "ai");

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
    recipes: AI_RECIPES,
  });

  await fs.writeFile(
    path.join(aiDir, "remotionui-agent.md"),
    `# RemotionUI Agent Instructions

You are building Remotion videos with RemotionUI.

Remotion is the framework. RemotionUI is the copy-paste component registry.

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

  await buildAiFiles(registry);
}

buildRegistry().catch((error) => {
  console.error("Registry build failed:", error);
  process.exit(1);
});
