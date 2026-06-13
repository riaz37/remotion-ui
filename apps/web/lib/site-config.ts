export const siteConfig = {
  name: "RemotionUI",
  tagline: "Production-ready motion for Remotion. Source you own.",
  explainer:
    "Full compositions: social clips, creator reels, launch scenes, not just effects. Install with the Remotion CLI, edit source in your repo.",
  description:
    "Remotion compositions and motion components. Install social clips, captions, and scenes with the CLI. Source you own, frame by frame.",
  url: "https://remotionui.com",
  githubUrl: "https://github.com/riaz37/remotion-ui",
  npmUrl: "https://www.npmjs.com/package/remotion-ui",
  docsUrl: "/docs",
} as const;

export const navLinks = [
  { text: "Documentation", url: "/docs", active: "nested-url" as const },
  { text: "Components", url: "/docs/components", active: "nested-url" as const },
  { text: "CLI", url: "/docs/cli", active: "url" as const },
] as const;
