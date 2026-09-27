import registry from "../../../registry.json";

/**
 * facts.ts: numbers and strings the film states, taken from the repo.
 *
 * COMPONENT_COUNT uses the rule in lib/registry-facts.ts (primitives, scenes
 * and compositions; no libs, hooks or utilities), which is also what the site
 * prints ("Install any of 210 components"). It is computed, not typed.
 */

type Item = { name: string; type: string; files: { path: string }[] };

const LIBRARY_SLUGS = new Set(["timing", "springs", "layout", "use-stagger"]);

const isComponent = (item: Item): boolean => {
  if (LIBRARY_SLUGS.has(item.name) || item.type === "registry:lib" || item.type === "registry:hook") {
    return false;
  }
  const first = item.files[0]?.path ?? "";
  return (
    first.includes("/compositions/") || first.includes("/scenes/") || first.includes("/primitives/") || item.type === "registry:ui"
  );
};

export const COMPONENT_SLUGS: string[] = (registry as { items: Item[] }).items.filter(isComponent).map((i) => i.name);
export const COMPONENT_COUNT = COMPONENT_SLUGS.length;

/**
 * Components with no poster in public/previews/ (checked with
 * scripts/check-tiles.mjs). Their wall tiles are rendered by the LaunchTile
 * composition into public/remotionui-launch/tiles/.
 */
export const MISSING_POSTERS = [
  "blur-focus-in", "staggered-fade-up", "masked-slide-reveal", "tracking-in", "light-sweep-text",
  "slot-roll", "matrix-decode", "rgb-glitch-text", "infinite-marquee", "perspective-marquee",
  "strikethrough-replace", "light-tunnel-bg", "text-reveal-shader", "dither-field-bg", "warp-bands-bg",
  "grain-gradient-bg", "product-turntable-3d", "text-extrude-3d", "card-stack-3d", "globe-points-3d",
] as const;

/** The command on the live docs page's Install block (captures/intro-docs.png). */
export const ADD_COMMAND = "npx remotion-ui@latest add intro";

/**
 * The CLI's real output, from packages/remotion-ui (v0.9.1, the version npm
 * serves) run as `add intro -y` against a fresh `init my-video`. npm's own
 * install chatter between the last two lines is left out.
 */
export const CLI_OUTPUT = {
  files: [
    "src/remotion/lib/code-syntax.tsx",
    "src/remotion/lib/layout.ts",
    "src/remotion/lib/timing.ts",
    "src/remotion/lib/motion-tokens.ts",
    "src/remotion/scenes/title-card/index.tsx",
    "src/remotion/lib/motion-wrapper.tsx",
    "src/remotion/primitives/fade-out.tsx",
    "src/compositions/intro/index.tsx",
  ],
  registered: 'Registered composition "Intro" in Root.tsx',
  installing: "Installing dependencies: remotion, @remotion/google-fonts",
  done: "Added 1 component(s) successfully.",
} as const;

/** README line 7 / CLI help. */
export const TAGLINE = "Source you own, frame by frame.";
export const END_COMMAND = "npx remotion-ui init";
/** lib/site-config.ts `url`. */
export const SITE = "remotionui.com";

/** Props the live intro docs page gives its Player (captures/intro-docs.png, Export snippet). */
export const INTRO_PROPS = {
  title: "Frame registry",
  subtitle: "Install compositions as source you own",
} as const;
