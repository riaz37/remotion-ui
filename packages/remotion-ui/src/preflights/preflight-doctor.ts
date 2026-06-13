import fs from "fs-extra";
import path from "node:path";
import type { RemotionUiConfig } from "../schema/index.js";
import {
  getConfig,
  resolveAliasPath,
} from "../utils/get-config.js";

export type DoctorCheck = {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
};

export type DoctorReport = {
  cwd: string;
  checks: DoctorCheck[];
  ok: boolean;
};

export async function runDoctor(cwd: string): Promise<DoctorReport> {
  const checks: DoctorCheck[] = [];
  const configPath = path.join(cwd, "remotion-ui.json");

  if (!(await fs.pathExists(configPath))) {
    checks.push({
      name: "remotion-ui.json",
      status: "fail",
      message: `Missing remotion-ui.json in ${cwd}. Run "npx remotion-ui init --existing".`,
    });
    return { cwd, checks, ok: false };
  }

  let config: RemotionUiConfig;
  try {
    config = await getConfig(cwd);
    checks.push({
      name: "remotion-ui.json",
      status: "pass",
      message: "Config found and valid.",
    });
  } catch (error) {
    checks.push({
      name: "remotion-ui.json",
      status: "fail",
      message:
        error instanceof Error ? error.message : "Invalid remotion-ui.json",
    });
    return { cwd, checks, ok: false };
  }

  const rootPath = path.resolve(cwd, config.remotion.root);
  if (await fs.pathExists(rootPath)) {
    checks.push({
      name: "remotion.root",
      status: "pass",
      message: `Root file exists: ${config.remotion.root}`,
    });
  } else {
    checks.push({
      name: "remotion.root",
      status: "fail",
      message: `Root file not found: ${config.remotion.root}`,
    });
  }

  const tsconfigPath = path.join(cwd, "tsconfig.json");
  if (await fs.pathExists(tsconfigPath)) {
    const tsconfig = (await fs.readJson(tsconfigPath)) as {
      compilerOptions?: { paths?: Record<string, string[]> };
    };
    const paths = tsconfig.compilerOptions?.paths ?? {};
    const aliasOk = Object.values(config.aliases).every((alias) => {
      if (!alias.startsWith("@/")) return true;
      const key = `${alias.split("/")[0]}/*`;
      const target = paths[key]?.[0];
      return target === "src/*" || target === "./src/*";
    });

    checks.push({
      name: "tsconfig.paths",
      status: aliasOk ? "pass" : "warn",
      message: aliasOk
        ? "tsconfig paths resolve @/ aliases."
        : 'tsconfig.json is missing "@/*": ["src/*"] for RemotionUI aliases.',
    });
  } else {
    checks.push({
      name: "tsconfig.paths",
      status: "warn",
      message: "No tsconfig.json found. Path aliases may not resolve.",
    });
  }

  for (const [category, alias] of Object.entries(config.aliases)) {
    const resolved = resolveAliasPath(cwd, alias);
    if (await fs.pathExists(resolved)) {
      checks.push({
        name: `alias:${category}`,
        status: "pass",
        message: `${alias} → ${path.relative(cwd, resolved)}`,
      });
    } else {
      checks.push({
        name: `alias:${category}`,
        status: "warn",
        message: `${alias} directory does not exist yet (${path.relative(cwd, resolved)})`,
      });
    }
  }

  const pkgPath = path.join(cwd, "package.json");
  if (await fs.pathExists(pkgPath)) {
    const pkg = (await fs.readJson(pkgPath)) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const remotionVersion =
      pkg.dependencies?.remotion ?? pkg.devDependencies?.remotion;

    if (!remotionVersion) {
      checks.push({
        name: "remotion.version",
        status: "warn",
        message: "remotion is not listed in package.json dependencies.",
      });
    } else {
      const expectedMajor = config.remotion.version;
      const installedMajor = remotionVersion.replace(/[^0-9].*$/, "");
      const match =
        !expectedMajor ||
        !installedMajor ||
        expectedMajor === installedMajor;

      checks.push({
        name: "remotion.version",
        status: match ? "pass" : "warn",
        message: match
          ? `Remotion ${remotionVersion} matches config (v${expectedMajor}).`
          : `Version mismatch: config expects v${expectedMajor}, package.json has ${remotionVersion}`,
      });
    }
  }

  const ok = !checks.some((check) => check.status === "fail");
  return { cwd, checks, ok };
}

export function formatDoctorReport(report: DoctorReport): string {
  const lines = [`RemotionUI doctor: ${report.cwd}`, ""];
  for (const check of report.checks) {
    const icon =
      check.status === "pass" ? "✓" : check.status === "warn" ? "⚠" : "✗";
    lines.push(`  ${icon} ${check.name}: ${check.message}`);
  }
  lines.push("");
  lines.push(report.ok ? "All required checks passed." : "Fix failures before adding components.");
  return lines.join("\n");
}

export function doctorReportToJson(report: DoctorReport): string {
  return JSON.stringify(report, null, 2);
}
