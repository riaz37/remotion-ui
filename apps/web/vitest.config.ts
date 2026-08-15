import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // The registry sources import each other through the `@/remotion/*` aliases,
  // which the bundler, the renderer and Next all resolve from their own config.
  // Without the same map here a test can only reach files that happen to use
  // relative imports — which is why the pure helpers were testable and nothing
  // that composes them was.
  resolve: {
    alias: {
      "@/remotion/primitives": path.join(
        __dirname,
        "registry/bases/default/primitives",
      ),
      "@/remotion/scenes": path.join(__dirname, "registry/bases/default/scenes"),
      "@/remotion/lib": path.join(__dirname, "registry/bases/default/lib"),
      "@/remotion/hooks": path.join(__dirname, "registry/bases/default/hooks"),
      "@/compositions": path.join(
        __dirname,
        "registry/bases/default/compositions",
      ),
      "@/components": path.join(__dirname, "components"),
      "@/lib": path.join(__dirname, "lib"),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
