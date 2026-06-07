#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AB = "/opt/homebrew/bin/agent-browser";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, ".qa-screenshots/design-overhaul");
const SESSION = "remotionui-visual-test";
const BASE = process.argv[2] ?? "http://localhost:3000";

const PAGES = [
  ["/", "homepage"],
  ["/docs", "docs-intro"],
  ["/docs/primitives/fade-in", "fade-in"],
  ["/docs/signals/caption-scene", "caption-scene"],
  ["/docs/compositions/social-clip", "social-clip"],
  ["/docs/spatial/map-flight", "map-flight"],
  ["/docs/atlas", "atlas-guide"],
];

function ab(...args) {
  return execFileSync(AB, ["--session", SESSION, ...args], { encoding: "utf-8" }).trim();
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function capture(route, name) {
  ab("open", `${BASE}${route}`);
  sleep(2000);
  const snap = ab("snapshot", "-i");
  const match = snap.match(/button "Play video" \[ref=(e\d+)\]/);
  if (match) {
    ab("click", `@${match[1]}`);
    sleep(1200);
  }
  ab("screenshot", path.join(OUT, `${name}.png`));
  console.log(`✓ ${name}`);
}

fs.mkdirSync(OUT, { recursive: true });

for (const [route, name] of PAGES) {
  capture(route, name);
}

// Light mode spot-check on homepage
ab("open", `${BASE}/`);
sleep(1500);
const snap = ab("snapshot", "-i");
const themeMatch = snap.match(/button "Toggle theme" \[ref=(e\d+)\]/);
if (themeMatch) {
  ab("click", `@${themeMatch[1]}`);
  sleep(800);
  ab("screenshot", path.join(OUT, "homepage-light.png"));
  console.log("✓ homepage-light");
}
