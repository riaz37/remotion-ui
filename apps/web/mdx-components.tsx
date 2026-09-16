import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { AgentStarter } from "@/components/docs/agent-starter";
import { CodeSnippet } from "@/components/docs/code-snippet";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { ComponentPage } from "@/components/component-page";
import { DocsBinCard } from "@/components/docs/docs-bin-card";
import { DocsIntro } from "@/components/docs/docs-intro";
import { InstallationSteps } from "@/components/docs/installation-steps";
import { ComponentsHub } from "@/components/docs/components-hub";
import { CategoryGrid } from "@/components/docs/category-grid";
import { InitCommand, InstallCommand, RenderCommand, SearchCommand, CommandRail } from "@/components/install-command";
import { ShowcaseVideo } from "@/components/showcase-video";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  // Asserted, not inferred: @react-three/fiber (the 3d registry lane) adds
  // `light`, `mesh`, … to the global JSX.IntrinsicElements, and mdx/types maps
  // every intrinsic element to a component type — `light` comes out as
  // Component<never>, which no longer satisfies MDXComponents' index signature.
  return {
    ...defaultMdxComponents,
    pre: (props) => <DocsCodeBlock {...props} />,
    AgentStarter,
    ComponentPage,
    DocsBinCard,
    DocsIntro,
    InstallationSteps,
    ComponentsHub,
    CategoryGrid,
    InstallCommand,
    InitCommand,
    RenderCommand,
    SearchCommand,
    CodeSnippet,
    CommandRail,
    ShowcaseVideo,
    ...components,
  } as MDXComponents;
}
