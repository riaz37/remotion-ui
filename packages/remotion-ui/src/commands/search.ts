import { fetchRegistryIndex } from "../registry/fetch-index.js";
import { filterRegistryItems } from "../registry/search-items.js";

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

  const results = filterRegistryItems(index.items, {
    query: options.query,
    lane: options.lane,
    tier: options.tier,
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
