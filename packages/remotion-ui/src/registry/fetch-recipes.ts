import fs from "fs-extra";
import path from "node:path";

export type AiRecipe = {
  slug: string;
  title: string;
  intent: string;
  components: string[];
  installCommand: string;
  docsUrl: string;
  prompt: string;
};

type RecipeManifest = {
  recipes: AiRecipe[];
};

const DEFAULT_RECIPES_URL = "https://remotionui.com/ai/recipes.json";

export async function fetchRecipes(
  registryUrl?: string,
): Promise<AiRecipe[]> {
  if (registryUrl && isLocalRegistry(registryUrl)) {
    const filePath = path.join(
      path.resolve(registryUrl),
      "..",
      "ai",
      "recipes.json",
    );
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`Recipes manifest not found at ${filePath}`);
    }
    const raw = await fs.readFile(filePath, "utf-8");
    return (JSON.parse(raw) as RecipeManifest).recipes ?? [];
  }

  const url = resolveRecipesUrl(registryUrl);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch recipes from ${url}`);
  }
  const data = (await response.json()) as RecipeManifest;
  return data.recipes ?? [];
}

export async function fetchRecipeBySlug(
  slug: string,
  registryUrl?: string,
): Promise<AiRecipe | undefined> {
  const recipes = await fetchRecipes(registryUrl);
  return recipes.find((recipe) => recipe.slug === slug);
}

function resolveRecipesUrl(registryUrl?: string): string {
  if (!registryUrl) {
    return DEFAULT_RECIPES_URL;
  }

  const base = registryUrl.replace(/\/r\/?$/, "").replace(/\/$/, "");
  return `${base}/ai/recipes.json`;
}

function isLocalRegistry(registryUrl: string): boolean {
  return (
    registryUrl.startsWith("/") ||
    registryUrl.startsWith("./") ||
    registryUrl.startsWith("../") ||
    registryUrl.startsWith("file:")
  );
}
