import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `preview-config.ts` is the one table `ComponentPage`, `atlas-mini-preview` and
 * the still-audit harness all read. `ComponentPage` also accepts a
 * `durationInFrames` prop, and the other two consumers cannot see it — so a
 * window set in MDX runs the docs player at one length while the atlas tile and
 * every render run the table's. Twenty components had drifted that way, which
 * is how a preview can look right on its docs page and come back frozen or
 * truncated from a render.
 *
 * The prop still exists for callers outside the docs catalog; what this guards
 * is that no component page uses it.
 */
const componentsDir = path.join(import.meta.dirname, "..", "content", "docs", "components");

describe("preview durations", () => {
  const offenders = fs
    .readdirSync(componentsDir)
    .filter((file) => file.endsWith(".mdx"))
    .flatMap((file) => {
      const tag = fs
        .readFileSync(path.join(componentsDir, file), "utf8")
        .match(/<ComponentPage[^>]*>/s);
      return tag && /durationInFrames=\{/.test(tag[0]) ? [file] : [];
    });

  it("live only in preview-config, never on a ComponentPage prop", () => {
    expect(offenders).toEqual([]);
  });
});
