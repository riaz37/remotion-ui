import fs from "node:fs";
import path from "node:path";

export type ExportSource = {
  importPath: string;
  exportName: string;
};

export type ComponentExportConfig = {
  slug: string;
  compositionId: string;
  source: ExportSource;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  renderFlags: string[];
};

export const EXPORT_DEFAULTS = {
  durationInFrames: 90,
  fps: 30,
  width: 1920,
  height: 1080,
  renderFlags: [] as string[],
} as const;

export const MAP_RENDER_FLAGS = ["--gl=angle", "--concurrency=1"] as const;

/** Per-component overrides when defaults or auto-discovery are not enough. */
export const EXPORT_OVERRIDES: Record<
  string,
  Partial<
    Omit<ComponentExportConfig, "slug" | "compositionId" | "source"> & {
      source?: ExportSource;
      preferRegistry?: boolean;
    }
  >
> = {
  "map-canvas": { renderFlags: [...MAP_RENDER_FLAGS] },
  "map-flight": { durationInFrames: 150, renderFlags: [...MAP_RENDER_FLAGS] },
  "map-markers": { renderFlags: [...MAP_RENDER_FLAGS] },
  "map-route": { renderFlags: [...MAP_RENDER_FLAGS] },
  "social-clip": {
    durationInFrames: 228,
    width: 1080,
    height: 1920,
  },
  "creator-reel": { durationInFrames: 180, width: 1080, height: 1920 },
  "podcast-clip": { durationInFrames: 180, width: 1080, height: 1920 },
  "data-story": { durationInFrames: 420 },
  v0: {
    source: {
      importPath: "@/components/previews/ai-composer-previews",
      exportName: "V0ComposerPreview",
    },
  },
  "chat-gpt": {
    source: {
      importPath: "@/components/previews/ai-composer-previews",
      exportName: "ChatGptPreview",
    },
  },
};

type RegistryItem = {
  name: string;
  type: string;
  files: Array<{ path: string }>;
};

function kebabToPascal(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function previewNameToSlug(exportName: string) {
  const base = exportName.replace(/Preview$/, "");
  return base
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

function readNamedExport(filePath: string) {
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(/export const (\w+)(?::[^=]+)?\s*=/);
  if (!match) {
    throw new Error(`Could not find a named export in ${filePath}`);
  }
  return match[1];
}

function registryImportPath(registryFile: string) {
  const withoutPrefix = registryFile.replace(/^registry\/bases\/default\//, "");
  const withoutIndex = withoutPrefix
    .replace(/\/index\.tsx$/, "")
    .replace(/\.tsx$/, "");
  const [category, name] = withoutIndex.split("/");

  if (!category || !name) {
    throw new Error(`Unsupported registry path: ${registryFile}`);
  }

  if (category === "primitives") {
    return `@/remotion/primitives/${name}`;
  }
  if (category === "scenes") {
    return `@/remotion/scenes/${name}`;
  }
  if (category === "compositions") {
    return `@/compositions/${name}`;
  }
  throw new Error(`Unsupported registry path: ${registryFile}`);
}

function buildPreviewIndex(previewsDir: string) {
  const index = new Map<string, ExportSource>();

  for (const fileName of fs.readdirSync(previewsDir)) {
    if (!fileName.endsWith(".tsx")) {
      continue;
    }

    const filePath = path.join(previewsDir, fileName);
    const content = fs.readFileSync(filePath, "utf8");
    const importPath = `@/components/previews/${fileName.replace(/\.tsx$/, "")}`;
    const exports = [...content.matchAll(/export const (\w+)(?::[^=]+)?\s*=/g)];

    for (const [exportName] of exports) {
      if (!exportName.endsWith("Preview")) {
        continue;
      }
      const slug = previewNameToSlug(exportName);
      index.set(slug, { importPath, exportName });
    }
  }

  return index;
}

function isRenderableItem(item: RegistryItem) {
  if (item.type === "registry:lib" || item.type === "registry:hook") {
    return false;
  }
  const filePath = item.files[0]?.path ?? "";
  return (
    filePath.includes("/primitives/") ||
    filePath.includes("/scenes/") ||
    filePath.includes("/compositions/")
  );
}

export function listExportableSlugs(registryItems: RegistryItem[]) {
  return registryItems.filter(isRenderableItem).map((item) => item.name).sort();
}

export function resolveExportConfig(
  appRoot: string,
  slug: string,
  options: {
    durationInFrames?: number;
    fps?: number;
    width?: number;
    height?: number;
    out?: string;
    usePreview?: boolean;
  } = {},
): ComponentExportConfig {
  const registry = JSON.parse(
    fs.readFileSync(path.join(appRoot, "registry.json"), "utf8"),
  ) as { items: RegistryItem[] };

  const item = registry.items.find((entry) => entry.name === slug);
  if (!item) {
    throw new Error(`Unknown registry item: ${slug}`);
  }
  if (!isRenderableItem(item)) {
    throw new Error(`"${slug}" is not a renderable component (lib/hook/utility).`);
  }

  const registryFile = item.files[0].path;
  const registrySourcePath = path.join(appRoot, registryFile);
  const exportName = readNamedExport(registrySourcePath);
  const compositionId = exportName;
  const registrySource: ExportSource = {
    importPath: registryImportPath(registryFile),
    exportName,
  };

  const previewIndex = buildPreviewIndex(path.join(appRoot, "components/previews"));
  const previewSource = previewIndex.get(slug);
  const overrides = EXPORT_OVERRIDES[slug] ?? {};

  const preferRegistry = overrides.preferRegistry ?? false;
  const usePreview =
    options.usePreview ??
    (!preferRegistry && Boolean(previewSource));

  const source = overrides.source ?? (usePreview ? previewSource : registrySource);
  if (!source) {
    throw new Error(
      `No preview wrapper found for "${slug}". Re-run with --registry to export the raw component.`,
    );
  }

  return {
    slug,
    compositionId,
    source,
    durationInFrames:
      options.durationInFrames ??
      overrides.durationInFrames ??
      EXPORT_DEFAULTS.durationInFrames,
    fps: options.fps ?? overrides.fps ?? EXPORT_DEFAULTS.fps,
    width: options.width ?? overrides.width ?? EXPORT_DEFAULTS.width,
    height: options.height ?? overrides.height ?? EXPORT_DEFAULTS.height,
    renderFlags: overrides.renderFlags ?? EXPORT_DEFAULTS.renderFlags,
  };
}

export function defaultOutputPath(slug: string) {
  return path.join("public", "showcases", `${slug}.mp4`);
}

export function compositionIdFromSlug(slug: string) {
  return kebabToPascal(slug);
}
