import manifest from "@/content/docs/recipes/manifest.json";
import { FilmstripScroll } from "@/components/studio/filmstrip-scroll";
import { LandingSection } from "@/components/landing/landing-section";
import { RecipeClipCard } from "@/components/landing/recipe-clip-card";

export function RecipeRail() {
  const recipes = manifest.recipes;

  return (
    <LandingSection
      title="Start from a recipe"
      lead="Task-first installs that pull the right scenes and compositions together."
      layout="full-bleed"
      action={{ href: "/docs/recipes", label: "All recipes →" }}
    >
      <FilmstripScroll>
        {recipes.map((recipe) => (
          <RecipeClipCard
            key={recipe.slug}
            slug={recipe.slug}
            title={recipe.title}
            components={recipe.components}
            installCommand={recipe.installCommand}
            flagshipComposition={recipe.flagshipComposition}
          />
        ))}
      </FilmstripScroll>
    </LandingSection>
  );
}
