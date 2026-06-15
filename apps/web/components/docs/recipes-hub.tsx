import Link from "next/link";
import manifest from "@/content/docs/recipes/manifest.json";
import { RecipeClipCard } from "@/components/landing/recipe-clip-card";
import { FilmstripScroll } from "@/components/studio/filmstrip-scroll";

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

      <div className="space-y-3 text-sm text-fd-muted-foreground">
        <p>
          Install with:{" "}
          <code className="font-[family-name:var(--font-mono)] text-fd-foreground">
            npx remotion-ui@latest add --recipe captioned-social-video
          </code>
        </p>
        <p>
          Machine-readable index:{" "}
          <Link href="/ai/recipes.json" className="link-phosphor">
            /ai/recipes.json
          </Link>
        </p>
      </div>
    </div>
  );
}
