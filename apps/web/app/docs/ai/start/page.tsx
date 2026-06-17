import { DocsPage, DocsDescription, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import { RecipeWizard } from "@/components/docs/recipe-wizard";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Recipe wizard",
  description:
    "Pick a video goal and get the right RemotionUI recipe with install commands.",
  openGraph: {
    title: "Recipe wizard — RemotionUI",
    description:
      "Pick a video goal and get the right RemotionUI recipe with install commands.",
    url: `${siteConfig.url}/docs/ai/start`,
  },
  alternates: {
    canonical: `${siteConfig.url}/docs/ai/start`,
  },
};

export default function RecipeWizardPage() {
  return (
    <DocsPage full breadcrumb={{ enabled: false }}>
      <DocsTitle className="text-display-lg font-medium tracking-tight">
        What are you building?
      </DocsTitle>
      <DocsDescription>
        Pick a goal to get a task-first recipe: components, install command, and
        docs in one place.
      </DocsDescription>
      <RecipeWizard />
    </DocsPage>
  );
}
