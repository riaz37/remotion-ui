export const siteConfig = {
  name: "RemotionUI",
  tagline: "Production-ready motion for Remotion. Source you own.",
  explainer:
    "Like shadcn/ui — install with the CLI, customize source in your repo.",
  description:
    "Registry-first motion components for Remotion. Install with the CLI, customize the source in your repo.",
  url: "https://remotionui.com",
  githubUrl: "https://github.com/riaz37/remotion-ui",
  npmUrl: "https://www.npmjs.com/package/remotion-ui",
  docsUrl: "/docs",
} as const;

export const navLinks = [
  { text: "Documentation", url: "/docs", active: "nested-url" as const },
  { text: "Components", url: "/docs/primitives/fade-in", active: "nested-url" as const },
  { text: "CLI", url: "/docs/cli", active: "url" as const },
] as const;
