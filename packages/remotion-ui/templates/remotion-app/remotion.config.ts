import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Components built on `@remotion/effects`, `<Solid>` or `<HtmlInCanvas>` run
// their effect chain on the GPU. Without an OpenGL renderer those frames render
// blank or unshaded — and the render still exits 0, so it fails silently.
// Use "swangle" instead on a machine with no GPU.
Config.setChromiumOpenGlRenderer("angle");
Config.overrideWebpackConfig((currentConfiguration) => {
  currentConfiguration.resolve ??= {};
  currentConfiguration.resolve.alias ??= {};
  currentConfiguration.resolve.alias["@"] = path.resolve("./src");
  return currentConfiguration;
});
