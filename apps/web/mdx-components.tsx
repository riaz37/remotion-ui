import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { ComponentPage } from "@/components/component-page";
import { InitCommand, InstallCommand, RenderCommand } from "@/components/install-command";
import { ShowcaseVideo } from "@/components/showcase-video";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ComponentPage,
    InstallCommand,
    InitCommand,
    RenderCommand,
    ShowcaseVideo,
    ...components,
  };
}
