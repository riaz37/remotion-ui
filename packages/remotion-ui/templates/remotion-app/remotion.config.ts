import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideWebpackConfig((currentConfiguration) => {
  currentConfiguration.resolve ??= {};
  currentConfiguration.resolve.alias ??= {};
  currentConfiguration.resolve.alias["@"] = path.resolve("./src");
  return currentConfiguration;
});
