#!/usr/bin/env node
/**
 * Render flagship showcase MP4s into apps/web/public/showcases/.
 *
 * Usage: pnpm render:showcases
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "apps", "web");
const OUT = path.join(WEB, "public", "showcases");

fs.mkdirSync(OUT, { recursive: true });

console.log("Rendering showcase MP4s into public/showcases/...\n");

try {
  execSync("pnpm render:showcases", {
    cwd: WEB,
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "1" },
  });
  console.log("\nShowcase renders complete.");
} catch (error) {
  console.error("\nShowcase render failed.");
  if (error instanceof Error && "status" in error) {
    process.exit(error.status ?? 1);
  }
  process.exit(1);
}
