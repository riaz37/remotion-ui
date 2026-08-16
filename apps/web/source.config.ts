import {
  defineCollections,
  defineConfig,
  defineDocs,
} from "fumadocs-mdx/config";
import { z } from "zod";

export const docs = defineDocs({
  dir: "content/docs",
});

export const blog = defineCollections({
  type: "doc",
  dir: "content/blog",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // YAML parses an unquoted `2026-08-16` into a Date, a quoted one into a
    // string. Accept both and normalise to an ISO string.
    date: z
      .union([z.string(), z.date()])
      .transform((value) =>
        value instanceof Date ? value.toISOString() : value,
      ),
    author: z.string().default("RemotionUI"),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export default defineConfig();
