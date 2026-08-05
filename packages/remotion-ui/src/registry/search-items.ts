import type { RegistryIndex } from "../schema/index.js";

export type FilterRegistryItemsOptions = {
  query?: string;
  lane?: string;
  tier?: string;
};

export function filterRegistryItems(
  items: RegistryIndex["items"],
  options: FilterRegistryItemsOptions = {},
): RegistryIndex["items"] {
  const query = options.query?.toLowerCase().trim();
  const lane = options.lane?.toLowerCase().trim();
  const tier = options.tier?.toLowerCase().trim();

  return items.filter((item) => {
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
}
