#!/usr/bin/env node
/**
 * Batch-register wave 2–5 components into registry.json and atlas.ts
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const registryPath = path.join(root, "apps/web/registry.json");
const atlasPath = path.join(root, "apps/web/registry/atlas.ts");

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const existing = new Set(registry.items.map((i) => i.name));

function ui(name, desc, file, deps = ["layout", "timing"]) {
  return {
    name,
    type: "registry:ui",
    description: desc,
    dependencies: ["remotion"],
    registryDependencies: deps,
    files: [{ path: `registry/bases/default/primitives/${file}`, type: "registry:ui" }],
  };
}

function cut(name, desc, file, deps = ["transition-timing", "springs"]) {
  return {
    name,
    type: "registry:ui",
    description: desc,
    dependencies: ["remotion", "@remotion/transitions"],
    registryDependencies: deps,
    files: [{ path: `registry/bases/default/primitives/${file}`, type: "registry:ui" }],
  };
}

function scene(name, desc, folder, deps = ["layout", "motion-tokens"]) {
  return {
    name,
    type: "registry:block",
    description: desc,
    dependencies: ["remotion"],
    registryDependencies: deps,
    files: [{ path: `registry/bases/default/scenes/${folder}/index.tsx`, type: "registry:block" }],
  };
}

function composition(name, desc, folder, component, deps, duration = 180) {
  return {
    name,
    type: "registry:block",
    description: desc,
    dependencies: ["remotion"],
    registryDependencies: deps,
    composition: {
      id: component,
      component,
      durationInFrames: duration,
      fps: 30,
      width: 1920,
      height: 1080,
      importPath: `@/compositions/${folder}/index`,
    },
    files: [{ path: `registry/bases/default/compositions/${folder}/index.tsx`, type: "registry:block" }],
  };
}

const newItems = [
  {
    name: "transition-timing",
    type: "registry:lib",
    description: "Layered transition timing helpers",
    dependencies: ["remotion", "@remotion/transitions"],
    registryDependencies: ["timing", "springs"],
    files: [{ path: "registry/bases/default/lib/transition-timing.ts", type: "registry:lib" }],
  },
  ui("mesh-gradient-bg", "Living mesh gradient background", "mesh-gradient-bg.tsx", ["motion-tokens"]),
  ui("dynamic-grid", "Subtle animated grid background", "dynamic-grid.tsx", ["motion-tokens"]),
  cut("directional-wipe", "Directional wipe transition", "directional-wipe.tsx"),
  cut("spatial-push", "Perspective push transition", "spatial-push.tsx"),
  cut("chromatic-aberration-wipe", "RGB glitch peak transition", "chromatic-aberration-wipe.tsx"),
  cut("zoom-through", "Aggressive zoom-through transition", "zoom-through.tsx"),
  ui("confetti-burst", "Deterministic confetti burst", "confetti-burst.tsx", []),
  ui("simulated-cursor", "Animated cursor with click states", "simulated-cursor.tsx", ["springs"]),
  scene("device-mockup-zoom", "Pull back to device mockup", "device-mockup-zoom", ["layout", "motion-tokens", "springs"]),
  scene("terminal-simulator", "CLI build log simulation", "terminal-simulator", ["layout", "motion-tokens"]),
  scene("code-accordion", "Collapsible code block", "code-accordion", ["layout", "motion-tokens"]),
  scene("code-diff-wipe", "Before/after code wipe", "code-diff-wipe", ["layout", "motion-tokens"]),
  scene("data-flow-pipes", "Data packets along SVG pipes", "data-flow-pipes", ["layout", "motion-tokens"]),
  scene("drag-drop-flow", "Drag file into drop zone", "drag-drop-flow", ["layout", "motion-tokens", "simulated-cursor"]),
  scene("chat-to-preview", "Chat morphs into preview layout", "chat-to-preview", ["layout", "motion-tokens"]),
  composition("hero-device-assemble", "Device layers assemble hero", "hero-device-assemble", "HeroDeviceAssemble", ["title-card", "device-mockup-zoom"]),
  composition("ecosystem-orbit", "Logo with orbiting satellites", "ecosystem-orbit", "EcosystemOrbit", ["layout", "timing"]),
  composition("bento-pan", "Diagonal bento grid pan", "bento-pan", "BentoPan", []),
  composition("browser-flow", "URL to browser preview flow", "browser-flow", "BrowserFlow", ["title-card", "chat-to-preview"]),
  composition("ai-generation-canvas", "Prompt to dashboard populate", "ai-generation-canvas", "AiGenerationCanvas", ["chat-to-preview", "stat-card"]),
  composition("live-code-split", "Code editor with live preview", "live-code-split", "LiveCodeSplit", ["code-reveal", "device-mockup-zoom"]),
  composition("deploy-reveal", "Terminal deploy to browser", "deploy-reveal", "DeployReveal", ["terminal-simulator", "device-mockup-zoom"]),
  composition("dashboard-populate", "Dashboard metrics populate", "dashboard-populate", "DashboardPopulate", ["metric-ticker", "animated-bar-chart"]),
  composition("pricing-focus", "Pricing tier focus animation", "pricing-focus", "PricingFocus", ["layout", "timing"]),
  composition("landing-code-showcase", "Landing with install commands", "landing-code-showcase", "LandingCodeShowcase", ["title-card", "code-reveal"]),
  composition("tool-menu-slide", "Tool menu slide-in", "tool-menu-slide", "ToolMenuSlide", ["layout", "timing"], 120),
  composition("image-expand", "Thumbnail expands fullscreen", "image-expand", "ImageExpand", ["timing"], 120),
];

for (const item of newItems) {
  if (!existing.has(item.name)) {
    registry.items.push(item);
    existing.add(item.name);
  }
}

fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

const atlasAdds = {
  "mesh-gradient-bg": { lane: "atoms", drive: "time", tier: "advanced", tags: ["background"] },
  "dynamic-grid": { lane: "atoms", drive: "time", tier: "advanced", tags: ["background"] },
  "directional-wipe": { lane: "cuts", drive: "time", tier: "advanced" },
  "spatial-push": { lane: "cuts", drive: "time", tier: "advanced" },
  "chromatic-aberration-wipe": { lane: "cuts", drive: "time", tier: "advanced" },
  "zoom-through": { lane: "cuts", drive: "time", tier: "advanced" },
  "confetti-burst": { lane: "atoms", drive: "time", tier: "advanced" },
  "simulated-cursor": { lane: "vectors", drive: "time", tier: "core" },
  "device-mockup-zoom": { lane: "spatial", drive: "spatial", tier: "advanced" },
  "terminal-simulator": { lane: "blocks", drive: "time", tier: "advanced" },
  "code-accordion": { lane: "blocks", drive: "time", tier: "advanced" },
  "code-diff-wipe": { lane: "blocks", drive: "time", tier: "advanced" },
  "data-flow-pipes": { lane: "blocks", drive: "data", tier: "advanced" },
  "drag-drop-flow": { lane: "blocks", drive: "time", tier: "advanced" },
  "chat-to-preview": { lane: "blocks", drive: "time", tier: "advanced" },
  "hero-device-assemble": { lane: "reels", drive: "time", tier: "advanced" },
  "ecosystem-orbit": { lane: "reels", drive: "time", tier: "advanced" },
  "bento-pan": { lane: "reels", drive: "time", tier: "advanced" },
  "browser-flow": { lane: "reels", drive: "time", tier: "advanced" },
  "ai-generation-canvas": { lane: "reels", drive: "time", tier: "advanced" },
  "live-code-split": { lane: "reels", drive: "time", tier: "advanced" },
  "deploy-reveal": { lane: "reels", drive: "time", tier: "advanced" },
  "dashboard-populate": { lane: "reels", drive: "data", tier: "advanced" },
  "pricing-focus": { lane: "reels", drive: "time", tier: "advanced" },
  "landing-code-showcase": { lane: "reels", drive: "time", tier: "advanced" },
  "tool-menu-slide": { lane: "reels", drive: "time", tier: "advanced" },
  "image-expand": { lane: "reels", drive: "media", tier: "advanced" },
};

let atlas = fs.readFileSync(atlasPath, "utf8");
for (const [slug, meta] of Object.entries(atlasAdds)) {
  if (!atlas.includes(`"${slug}"`)) {
    const line = `  "${slug}": ${JSON.stringify(meta).replace(/"([^"]+)":/g, "$1:")},`;
    atlas = atlas.replace(
      /(\n};\n\nexport function getAtlasMeta)/,
      `\n${line}$1`,
    );
  }
}
fs.writeFileSync(atlasPath, atlas);

console.log("Registered", newItems.length, "items");
