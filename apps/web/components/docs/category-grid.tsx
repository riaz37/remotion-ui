import { ComponentCard } from "@/components/component-card";
import { getComponentCategory } from "@/lib/component-categories";

type CategoryGridProps = {
  /** Folder group name without parentheses, e.g. "text-effects". */
  category: string;
};

/**
 * Card grid for a category landing page. Items and titles come from the page
 * tree, so the grid follows the sidebar order and names exactly.
 *
 * `lib/source` is imported lazily: this component is imported by MDX that the
 * docs collection itself loads, so a static import forms a module cycle
 * (`Cannot access 'docs' before initialization` in routes such as the sitemap).
 */
export async function CategoryGrid({ category }: CategoryGridProps) {
  const { source } = await import("@/lib/source");
  const group = getComponentCategory(source.pageTree, category);
  if (!group) {
    throw new Error(`CategoryGrid: unknown component category "${category}"`);
  }

  return (
    <div className="not-prose mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {group.items.map((item) => (
        <ComponentCard
          key={item.slug}
          name={item.title}
          slug={item.slug}
          url={item.url}
          description={item.description}
        />
      ))}
    </div>
  );
}
