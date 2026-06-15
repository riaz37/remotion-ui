import Link from "next/link";
import { InstallCommand } from "@/components/install-command";
import manifest from "@/content/docs/recipes/manifest.json";
import { hasCompositionPlayground } from "@/lib/composition-playground";

export const metadata = {
  title: "Recipe wizard",
  description:
    "Pick a video goal and get the right RemotionUI recipe with install commands.",
};

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

export default function RecipeWizardPage() {
  const recipes = manifest.recipes;

  return (
    <div className="not-prose">
      <h1 className="text-display-lg font-medium tracking-tight">
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
          const hasPlayground = recipe.flagshipComposition
            ? hasCompositionPlayground(recipe.flagshipComposition)
            : false;

          return (
            <article
              key={goal.recipeSlug}
              className="rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)] p-5"
            >
              <p className="font-[family-name:var(--font-mono)] text-[0.6875rem] text-[var(--bay-phosphor)]">
                {goal.label}
              </p>
              <h2 className="mt-2 text-lg font-semibold">{recipe.title}</h2>
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
