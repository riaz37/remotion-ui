import registry from "@/registry.json";

/** Registry entries that are library code, not something you compose with. */
const LIBRARY_SLUGS = new Set(["timing", "springs", "layout", "use-stagger"]);

type RegistryItem = {
  name: string;
  type: string;
  files: { path: string }[];
};

function isComponent(item: RegistryItem): boolean {
  if (
    LIBRARY_SLUGS.has(item.name) ||
    item.type === "registry:lib" ||
    item.type === "registry:hook"
  ) {
    return false;
  }

  const firstPath = item.files[0]?.path ?? "";
  return (
    firstPath.includes("/compositions/") ||
    firstPath.includes("/scenes/") ||
    firstPath.includes("/primitives/") ||
    item.type === "registry:ui"
  );
}

/**
 * How many components the registry ships: primitives plus scenes plus
 * compositions, excluding libs, hooks and utilities.
 *
 * Counted here with the same rule `scripts/build-registry.mts` uses to write
 * REGISTRY_COUNT into the hero-loop composition, so the number the page states
 * and the number burned into the loop cannot drift apart.
 */
export const componentCount = (
  registry as { items: RegistryItem[] }
).items.filter(isComponent).length;
