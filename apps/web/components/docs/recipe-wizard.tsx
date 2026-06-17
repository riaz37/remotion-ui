import Link from "next/link";
import { InstallCommand } from "@/components/install-command";
import manifest from "@/content/docs/recipes/manifest.json";
import { hasCompositionPlayground } from "@/lib/composition-playground";

const GOALS = [
  {
    label: "Creator reel",
    recipeSlug: "creator-reel",
    compositionHref: "/docs/compositions/creator-reel",
  },
  {
    label: "Social clip",
    recipeSlug: "captioned-social-video",
    compositionHref: "/docs/compositions/social-clip",
  },
  {
    label: "Podcast",
    recipeSlug: "podcast-clip",
    compositionHref: "/docs/compositions/podcast-clip",
  },
  {
    label: "Data story",
    recipeSlug: "data-story",
    compositionHref: "/docs/compositions/data-story",
  },
  {
    label: "Product intro",
    recipeSlug: "product-intro",
    compositionHref: "/docs/compositions/intro",
  },
] as const;

export function RecipeWizard() {
  const recipes = manifest.recipes;

  return (
    <div className="not-prose space-y-10">
      <div className="grid gap-8 md:grid-cols-2">
        {GOALS.map((goal) => {
          const recipe = recipes.find((entry) => entry.slug === goal.recipeSlug);
          if (!recipe) return null;
          const hasPlayground = recipe.flagshipComposition
            ? hasCompositionPlayground(recipe.flagshipComposition)
            : false;

          return (
            <article key={goal.recipeSlug} className="space-y-4">
              <div>
                <p className="font-[family-name:var(--font-mono)] text-[0.6875rem] text-[var(--bay-phosphor)]">
                  {goal.label}
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-lg font-medium tracking-tight">
                  {recipe.title}
                </h2>
                <p className="mt-2 text-sm text-fd-muted-foreground">
                  {recipe.intent}
                </p>
              </div>
              <InstallCommand name={recipe.slug} recipe label="Install" />
              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  href={goal.compositionHref}
                  className="link-phosphor font-medium"
                >
                  {hasPlayground ? "Open playground →" : "Preview composition →"}
                </Link>
                <Link
                  href={`/docs/recipes/${recipe.slug}`}
                  className="text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                >
                  Recipe docs
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
