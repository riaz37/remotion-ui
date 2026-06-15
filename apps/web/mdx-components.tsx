import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { CodeSnippet } from "@/components/docs/code-snippet";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { ComponentPage } from "@/components/component-page";
import { DocsBinCard } from "@/components/docs/docs-bin-card";
import { DocsIntro } from "@/components/docs/docs-intro";
import { InstallationSteps } from "@/components/docs/installation-steps";
import { ComponentsHub } from "@/components/docs/components-hub";
import { RecipesHub } from "@/components/docs/recipes-hub";
import { InitCommand, InstallCommand, RenderCommand, SearchCommand, CommandRail } from "@/components/install-command";
import { ShowcaseVideo } from "@/components/showcase-video";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    pre: (props) => <DocsCodeBlock {...props} />,
    ComponentPage,
    DocsBinCard,
    DocsIntro,
    InstallationSteps,
    RecipesHub,
    ComponentsHub,
    InstallCommand,
    InitCommand,
    RenderCommand,
    SearchCommand,
    CodeSnippet,
    CommandRail,
    ShowcaseVideo,
    ...components,
  };
}
