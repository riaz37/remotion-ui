import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

// The server reports this to MCP clients on initialize. Injecting it here keeps
// it from drifting out of sync with the published package on every release.
const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string };

export default defineConfig({
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  entry: { index: "src/index.ts" },
  banner: { js: "#!/usr/bin/env node" },
  define: { __MCP_VERSION__: JSON.stringify(version) },
});
