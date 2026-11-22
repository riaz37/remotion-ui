import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

// Static export: emit the whole index at build time; the dialog searches it client-side.
export const revalidate = false;

export const { staticGET: GET } = createFromSource(source, {
  language: "english",
});
