import path from "node:path";
import { Config } from "@remotion/cli/config";

const root = path.resolve(__dirname);

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideWebpackConfig((currentConfiguration) => {
  currentConfiguration.resolve ??= {};
  currentConfiguration.resolve.alias ??= {};
  const alias = currentConfiguration.resolve.alias as Record<string, string>;

  alias["@"] = root;
  alias["@/remotion/primitives"] = path.join(
    root,
    "registry/bases/default/primitives",
  );
  alias["@/remotion/scenes"] = path.join(root, "registry/bases/default/scenes");
  alias["@/compositions"] = path.join(
    root,
    "registry/bases/default/compositions",
  );
  alias["@/remotion/lib"] = path.join(root, "registry/bases/default/lib");
  alias["@/remotion/hooks"] = path.join(root, "registry/bases/default/hooks");

  return currentConfiguration;
});
