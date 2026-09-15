import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  pageTree: {
    transformers: [
      {
        // Copy `new: true` frontmatter onto the tree item so the custom
        // sidebar item (components/docs/sidebar-item.tsx) can badge it.
        file(node, filePath) {
          if (!filePath) return node;
          const file = this.storage.read(filePath);
          const isNew =
            file?.format === "page" &&
            (file.data as { new?: boolean }).new === true;
          return isNew ? { ...node, new: true } : node;
        },
      },
    ],
  },
});
