const path = require("node:path");
const { Config } = require("@remotion/cli/config");

// __dirname can point at Remotion CLI internals when the config is bundled.
const root = process.cwd();

const registryAliases = {
  "@/components": path.join(root, "components"),
  "@/remotion/primitives": path.join(root, "registry/bases/default/primitives"),
  "@/remotion/scenes": path.join(root, "registry/bases/default/scenes"),
  "@/compositions": path.join(root, "registry/bases/default/compositions"),
  "@/remotion/lib": path.join(root, "registry/bases/default/lib"),
  "@/remotion/hooks": path.join(root, "registry/bases/default/hooks"),
  "@/lib": path.join(root, "lib"),
};

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideWebpackConfig((config) => {
  config.resolve ??= {};
  const previous = config.resolve.alias;
  const base =
    previous && typeof previous === "object" && !Array.isArray(previous)
      ? { ...previous }
      : {};

  // Remotion maps `@` to its CLI dist, which breaks registry `@/remotion/*` imports.
  delete base["@"];

  config.resolve.alias = {
    ...base,
    ...registryAliases,
  };

  return config;
});
