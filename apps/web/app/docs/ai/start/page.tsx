import Link from "next/link";
import { InstallCommand } from "@/components/install-command";
import manifest from "@/content/docs/ai/recipes/manifest.json";

export const metadata = {
  title: "Recipe wizard",
  description:
    "Pick a video goal and get the right RemotionUI recipe with install commands.",
};

const GOALS = [
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

export default function RecipeWizardPage() {
  const recipes = manifest.recipes;

  return (
    <div className="not-prose">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
        What are you building?
      </h1>
      <p className="mt-3 max-w-2xl text-fd-muted-foreground">
        Pick a goal to get a task-first recipe: components, install command, and
        docs in one place.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {GOALS.map((goal) => {
          const recipe = recipes.find((entry) => entry.slug === goal.recipeSlug);
          if (!recipe) return null;

          return (
            <article
              key={goal.recipeSlug}
              className="rounded-2xl border border-fd-border bg-fd-card/70 p-5"
            >
              <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-fd-primary">
                {goal.label}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold">
                {recipe.title}
              </h2>
              <p className="mt-2 text-sm text-fd-muted-foreground">
                {recipe.intent}
              </p>
              <div className="mt-4">
                <InstallCommand
                  name={`--recipe ${recipe.slug}`}
                  label="Install recipe"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link
                  href={goal.compositionHref}
                  className="font-medium text-fd-primary transition-opacity hover:opacity-80"
                >
                  Preview composition →
                </Link>
                <Link
                  href={`/docs/ai/recipes/${recipe.slug}`}
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
