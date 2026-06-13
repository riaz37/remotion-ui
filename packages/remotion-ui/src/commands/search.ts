import fs from "fs-extra";
import path from "node:path";
import { fetchRegistryIndex } from "../registry/fetch-index.js";

export type SearchOptions = {
  query?: string;
  lane?: string;
  tier?: string;
  registryUrl?: string;
  json?: boolean;
};

export async function searchCommand(
  options: SearchOptions = {},
): Promise<void> {
  const index = await fetchRegistryIndex(options.registryUrl);
  const query = options.query?.toLowerCase().trim();
  const lane = options.lane?.toLowerCase().trim();
  const tier = options.tier?.toLowerCase().trim();

  const results = index.items.filter((item) => {
    if (lane && item.atlas?.lane !== lane) {
      return false;
    }
    if (tier && item.atlas?.tier !== tier) {
      return false;
    }
    if (!query) return true;
    return (
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query) ||
      item.atlas?.lane.toLowerCase().includes(query) ||
      item.atlas?.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  if (options.json) {
    console.log(JSON.stringify({ count: results.length, items: results }, null, 2));
    return;
  }

  if (results.length === 0) {
    console.log("No components found.");
    return;
  }

  for (const item of results) {
    const desc = item.description ? `: ${item.description}` : "";
    const atlas = item.atlas
      ? ` [${item.atlas.lane}/${item.atlas.tier}]`
      : "";
    console.log(`${item.name} (${item.type})${atlas}${desc}`);
  }

  console.log(`\n${results.length} result(s)`);
}
