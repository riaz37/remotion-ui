import Link from "next/link";
import { DocsBinCard } from "@/components/docs/docs-bin-card";
import { RenderQueueStrip } from "@/components/landing/render-queue-strip";
import { InitCommand } from "@/components/install-command";
import { CLI_PACKAGE, cliAddCommand } from "@/lib/docs-cli";

const QUICK_PATHS = [
  {
    title: "Components",
    description: "Browse 62 components with live previews.",
    href: "/docs/components",
  },
  {
    title: "Recipes",
    description: "Task-first installs for social clips, data stories, and more.",
    href: "/docs/recipes",
  },
  {
    title: "Installation",
    description: "Initialize a project and add your first composition.",
    href: "/docs/installation",
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: 1,
    label: "Initialize",
    command: `${CLI_PACKAGE} init my-video --starter social`,
    showPmTabs: true,
  },
  {
    step: 2,
    label: "Add",
    command: cliAddCommand("social-clip"),
  },
  {
    step: 3,
    label: "Render",
    command: "npx remotion render src/Root.tsx SocialClip out/social-clip.mp4",
  },
] as const;

export function DocsIntro() {
  return (
    <div className="not-prose space-y-10">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight">
          How it works
        </h2>
        <div className="mt-6">
          <RenderQueueStrip
            steps={HOW_IT_WORKS}
            outputPath="src/remotion/"
            layout="vertical"
          />
        </div>
      </div>

      <div className="rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)] px-4 py-4 text-sm text-fd-muted-foreground">
        New here? Start with{" "}
        <Link href="/docs/installation" className="link-phosphor">
          Installation
        </Link>
        , pick a{" "}
        <Link href="/docs/recipes" className="link-phosphor">
          recipe
        </Link>
        , or open the{" "}
        <Link href="/docs/components" className="link-phosphor">
          component catalog
        </Link>
        .
      </div>
    </div>
  );
}
