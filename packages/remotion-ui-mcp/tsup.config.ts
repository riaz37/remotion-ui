import { defineConfig } from "tsup";

export default defineConfig({
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  entry: { index: "src/index.ts" },
  banner: { js: "#!/usr/bin/env node" },
});
