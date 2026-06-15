import Link from "next/link";
import manifest from "@/content/docs/recipes/manifest.json";
import { FilmstripScroll } from "@/components/studio/filmstrip-scroll";
import { PerforationRule } from "@/components/studio/perforation-rule";

export function RecipeRail() {
  const recipes = manifest.recipes;

  return (
    <section className="border-b border-[var(--bay-border)] py-[120px]">
      <div className="mx-auto max-w-[1120px] px-6">
        <PerforationRule className="mb-16" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-display-lg">Start from a recipe</h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
              Task-first installs that pull the right scenes and compositions
              together.
            </p>
          </div>
          <Link
            href="/docs/recipes"
            className="link-phosphor text-sm font-medium"
          >
            All recipes →
          </Link>
        </div>
        <div className="mt-10">
          <FilmstripScroll>
            {recipes.map((recipe) => (
              <Link
                key={recipe.slug}
                href={`/docs/recipes/${recipe.slug}`}
                className="motion-border min-w-[260px] max-w-[280px] shrink-0 snap-start rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)] p-5 hover:border-[var(--bay-border-strong)]"
              >
                <p className="font-[family-name:var(--font-mono)] text-[0.6875rem] text-[var(--bay-phosphor)]">
                  {recipe.flagshipComposition ?? recipe.components[0]}
                </p>
                <h3 className="mt-2 text-base font-semibold text-fd-foreground">
                  {recipe.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-fd-muted-foreground">
                  {recipe.intent}
                </p>
              </Link>
            ))}
          </FilmstripScroll>
        </div>
      </div>
    </section>
  );
}
