import path from "node:path";
import fs from "fs-extra";
import { generate, type CompositionInfo } from "../import-ae/codegen.js";
import { toKebabCase, toPascalCase } from "../import-ae/names.js";
import { parseLottie, type ParsedAnimation } from "../import-ae/parse.js";
import type { ImportIssue } from "../import-ae/properties.js";
import { formatIssues, summarizeUnsupported } from "../import-ae/report.js";
import { LIMITS } from "../import-ae/schema.js";
import { patchRootTsx } from "../remotion/composition-patch.js";
import { getConfig, resolveAliasPath } from "../utils/get-config.js";
import { RemotionUiError, toErrorJson } from "../utils/errors.js";
import { writeFile } from "../utils/index.js";
import { addCommand } from "./add.js";

export type ImportAeOptions = {
  cwd?: string;
  out?: string;
  name?: string;
  /** Generate anyway, listing what was left out. */
  skipUnsupported?: boolean;
  /** Overwrite existing files in the output directory. */
  force?: boolean;
  /** Register the composition in Root.tsx (default: when a config exists). */
  register?: boolean;
  /** Install the `ae-import` runtime when it is missing (default: true). */
  install?: boolean;
  registryUrl?: string;
  /** Override the module the generated code imports the runtime from. */
  runtimeImport?: string;
  json?: boolean;
};

export type ImportAeResult = {
  ok: true;
  files: string[];
  composition: CompositionInfo;
  issues: ImportIssue[];
  registered: boolean;
  runtimeInstalled: boolean;
};

const RUNTIME_ITEM = "ae-import";
const COMPONENT_NAME = /^[A-Z][A-Za-z0-9]*$/;

async function loadConfig(cwd: string) {
  try {
    return await getConfig(cwd);
  } catch (error) {
    if (error instanceof RemotionUiError && error.code === "CONFIG_NOT_FOUND") return null;
    throw error;
  }
}

function resolveName(requested: string | undefined, parsed: ParsedAnimation, file: string): string {
  if (requested !== undefined) {
    if (!COMPONENT_NAME.test(requested)) {
      throw new RemotionUiError(
        "INVALID_ARGS",
        `--name must be a PascalCase identifier (letters and digits, starting with a capital), got "${requested}".`,
      );
    }
    return requested;
  }
  const fromFile = path.basename(file, path.extname(file));
  const source = parsed.name && parsed.name !== "Animation" ? parsed.name : fromFile;
  return toPascalCase(source, "Animation");
}

async function readInput(file: string): Promise<string> {
  const stat = await fs.stat(file).catch(() => null);
  if (!stat || !stat.isFile()) {
    throw new RemotionUiError("INVALID_ARGS", `Cannot read "${file}": no such file.`);
  }
  if (stat.size > LIMITS.fileBytes) {
    throw new RemotionUiError("LOTTIE_INVALID", `"${file}" is larger than ${LIMITS.fileBytes / 1024 / 1024} MB.`);
  }
  return fs.readFile(file, "utf-8");
}

/** Import path for the generated index from Root.tsx: the alias when it applies, else relative. */
function rootImportPath(cwd: string, rootFile: string, outDir: string, compositionsAlias: string): string {
  const aliasDir = resolveAliasPath(cwd, compositionsAlias);
  const relToAlias = path.relative(aliasDir, outDir);
  if (compositionsAlias.startsWith("@/") && !relToAlias.startsWith("..") && !path.isAbsolute(relToAlias)) {
    return `${compositionsAlias}/${relToAlias.split(path.sep).join("/")}/index`;
  }
  const relative = path.relative(path.dirname(rootFile), path.join(outDir, "index")).split(path.sep).join("/");
  return relative.startsWith(".") ? relative : `./${relative}`;
}

/**
 * Install the runtime through `add`. When the registry does not have it (a
 * registry deployed before `ae-import` existed, or offline), say what was
 * already written and how to finish, instead of a bare fetch error.
 */
async function installRuntime(cwd: string, registryUrl: string | undefined, json: boolean, written: string[]): Promise<void> {
  try {
    await addCommand([RUNTIME_ITEM], { cwd, registryUrl, showStarPrompt: false, silent: json });
  } catch (error) {
    if (!(error instanceof RemotionUiError) || !["REGISTRY_ITEM_NOT_FOUND", "REGISTRY_FETCH_FAILED"].includes(error.code)) {
      throw error;
    }
    throw new RemotionUiError(
      error.code,
      `The generated files were written (${written.join(", ")}), but the "${RUNTIME_ITEM}" runtime could not be installed ` +
        `from ${registryUrl ?? "the default registry"}: ${error.message}\n` +
        `Point at a registry that has it with --registry-url <url or path to public/r>, ` +
        `or re-run with --no-install (and --force) and add the runtime yourself with "npx remotion-ui add ${RUNTIME_ITEM}" once it is published.`,
    );
  }
}

function printReport(parsed: ParsedAnimation, log: (line: string) => void): void {
  const info = formatIssues(parsed.issues, "info");
  if (info.length > 0) log(`\nNotes (${info.length}):\n${info.join("\n")}`);
}

export async function importAeCommand(file: string, options: ImportAeOptions = {}): Promise<ImportAeResult> {
  const json = options.json ?? false;
  const log = (line: string) => {
    if (!json) console.log(line);
  };
  try {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const input = path.resolve(cwd, file);
    const parsed = parseLottie(await readInput(input));

    const unsupported = parsed.issues.filter((issue) => issue.level === "unsupported");
    if (unsupported.length > 0 && !options.skipUnsupported) {
      const lines = formatIssues(parsed.issues, "unsupported");
      throw new RemotionUiError(
        "LOTTIE_UNSUPPORTED",
        `"${path.basename(input)}" uses ${unsupported.length} feature(s) import-ae cannot carry over yet — nothing was written:\n` +
          `${lines.join("\n")}\n\n` +
          "Re-run with --skip-unsupported to generate everything else; the skipped items are listed at the top of the generated file.",
      );
    }

    const name = resolveName(options.name, parsed, input);
    const config = await loadConfig(cwd);
    const outDir = options.out
      ? path.resolve(cwd, options.out)
      : config
        ? path.join(resolveAliasPath(cwd, config.aliases.compositions), toKebabCase(name))
        : path.join(cwd, toKebabCase(name));
    const runtimeImport = options.runtimeImport ?? `${config?.aliases.lib ?? "@/remotion/lib"}/${RUNTIME_ITEM}`;

    const { files, composition } = generate(parsed, {
      name,
      sourceLabel: path.basename(input),
      runtimeImport,
      issues: parsed.issues,
    });

    const targets = files.map((f) => path.join(outDir, f.path));
    if (!options.force) {
      const existing = [];
      for (const target of targets) if (await fs.pathExists(target)) existing.push(path.relative(cwd, target));
      if (existing.length > 0) {
        throw new RemotionUiError("TARGET_EXISTS", `Refusing to overwrite ${existing.join(", ")}. Pass --force to replace them.`);
      }
    }
    for (const [index, generated] of files.entries()) {
      await writeFile(targets[index], generated.content);
      log(`  ✓ ${path.relative(cwd, targets[index])}`);
    }

    let registered = false;
    if (config && options.register !== false) {
      const rootFile = path.resolve(cwd, config.remotion.root);
      if (await fs.pathExists(rootFile)) {
        await patchRootTsx(
          rootFile,
          { ...composition, importPath: rootImportPath(cwd, rootFile, outDir, config.aliases.compositions) },
          { log },
        );
        registered = true;
      } else {
        log(`  · ${config.remotion.root} not found; register the composition yourself (see the exported config).`);
      }
    }

    let runtimeInstalled = false;
    if (config && options.install !== false && options.runtimeImport === undefined) {
      const runtimeFile = path.join(resolveAliasPath(cwd, config.aliases.lib), `${RUNTIME_ITEM}.tsx`);
      if (await fs.pathExists(runtimeFile)) runtimeInstalled = true;
      else {
        log(`\nInstalling the ${RUNTIME_ITEM} runtime…`);
        await installRuntime(cwd, options.registryUrl, json, targets.map((t) => path.relative(cwd, t)));
        runtimeInstalled = true;
      }
    } else if (!config && !json) {
      log(`\nNo remotion-ui.json here: add the runtime with "npx remotion-ui add ${RUNTIME_ITEM}" in your project.`);
    }

    if (unsupported.length > 0) {
      log(`\n⚠ Generated without: ${summarizeUnsupported(parsed.issues)} (listed in ${path.relative(cwd, targets[0])}).`);
    }
    printReport(parsed, log);
    log(
      `\nImported "${composition.id}": ${composition.width}×${composition.height}, ${composition.fps} fps, ${composition.durationInFrames} frames.`,
    );

    const result: ImportAeResult = {
      ok: true,
      files: targets.map((t) => path.relative(cwd, t)),
      composition,
      issues: parsed.issues,
      registered,
      runtimeInstalled,
    };
    if (json) console.log(JSON.stringify(result));
    return result;
  } catch (error) {
    if (json) console.log(JSON.stringify(toErrorJson(error)));
    throw error;
  }
}
