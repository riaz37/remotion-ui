import Link from "next/link";
import manifest from "@/content/docs/recipes/manifest.json";
import { RecipeClipCard } from "@/components/landing/recipe-clip-card";
import { FilmstripScroll } from "@/components/studio/filmstrip-scroll";
import { InstallCommand } from "@/components/install-command";

export function RecipesHub() {
  return (
    <div className="not-prose space-y-8">
      <FilmstripScroll>
        {manifest.recipes.map((recipe) => (
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

      <InstallCommand name="captioned-social-video" recipe label="Example install" />

      <p className="text-sm text-fd-muted-foreground">
        Machine-readable index:{" "}
        <Link href="/ai/recipes.json" className="link-phosphor">
          /ai/recipes.json
        </Link>
      </p>
    </div>
  );
}
