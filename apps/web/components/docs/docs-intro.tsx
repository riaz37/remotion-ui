import Link from "next/link";
import { DocsBinCard } from "@/components/docs/docs-bin-card";

const HOW_IT_WORKS = [
  {
    title: "CLI installs source",
    description:
      "The npm package is a CLI. Components copy into your repo as editable files — not a runtime dependency.",
  },
  {
    title: "Remotion renders frames",
    description:
      "Installed components are plain React. Animate with useCurrentFrame(), interpolate(), and spring().",
  },
  {
    title: "Recipes or à la carte",
    description:
      "Start from a recipe for a full video, or pick individual scenes and primitives from the catalog.",
  },
] as const;

const QUICK_PATHS = [
  {
    title: "Installation",
    description: "Initialize a project and add your first composition.",
    href: "/docs/installation",
  },
  {
    title: "Recipes",
    description: "Task-first installs for social clips, data stories, and more.",
    href: "/docs/recipes",
  },
  {
    title: "Components",
    description: "Browse 62 components with live previews.",
    href: "/docs/components",
  },
] as const;

export function DocsIntro() {
  return (
    <div className="not-prose space-y-10">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight">
          How it works
        </h2>
        <ul className="mt-4 space-y-4">
          {HOW_IT_WORKS.map((item) => (
            <li
              key={item.title}
              className="rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)] px-4 py-4"
            >
              <p className="font-medium text-fd-foreground">{item.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-fd-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight">
          Quick paths
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {QUICK_PATHS.map((path) => (
            <DocsBinCard key={path.href} {...path} />
          ))}
        </div>
      </div>

      <div className="rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)] px-4 py-4 text-sm text-fd-muted-foreground">
        Ready to build? Follow{" "}
        <Link href="/docs/installation" className="link-phosphor">
          Installation
        </Link>
        , pick a{" "}
        <Link href="/docs/recipes" className="link-phosphor">
          recipe
        </Link>
        , or browse the{" "}
        <Link href="/docs/components" className="link-phosphor">
          component catalog
        </Link>
        .
      </div>
    </div>
  );
}
