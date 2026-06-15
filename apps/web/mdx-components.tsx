import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { ComponentPage } from "@/components/component-page";
import { DocsBinCard } from "@/components/docs/docs-bin-card";
import { DocsIntro } from "@/components/docs/docs-intro";
import { InstallationSteps } from "@/components/docs/installation-steps";
import { RecipesHub } from "@/components/docs/recipes-hub";
import { InitCommand, InstallCommand, RenderCommand } from "@/components/install-command";
import { ShowcaseVideo } from "@/components/showcase-video";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ComponentPage,
    DocsBinCard,
    DocsIntro,
    InstallationSteps,
    RecipesHub,
    InstallCommand,
    InitCommand,
    RenderCommand,
    ShowcaseVideo,
    ...components,
  };
}
