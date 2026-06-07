import { defineConfig } from "tsup";

const shared = {
  format: ["esm"] as const,
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
};

export default defineConfig([
  {
    ...shared,
    entry: { index: "src/index.ts" },
    banner: { js: "#!/usr/bin/env node" },
  },
  {
    ...shared,
    entry: {
      "schema/index": "src/schema/index.ts",
      "registry/index": "src/registry/index.ts",
    },
    clean: false,
  },
]);
