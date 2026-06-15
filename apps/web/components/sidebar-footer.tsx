import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function SidebarFooter() {
  return (
    <div className="space-y-3 border-t border-[var(--bay-border)] px-2 py-4 text-xs text-fd-muted-foreground">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/docs/installation"
          className="rounded-md px-2 py-1 transition-colors hover:bg-[var(--bay-surface-raised)] hover:text-fd-foreground"
        >
          Install
        </Link>
        <Link
          href="/docs/components"
          className="rounded-md px-2 py-1 transition-colors hover:bg-[var(--bay-surface-raised)] hover:text-fd-foreground"
        >
          Storyboard
        </Link>
        <Link
          href="/docs/recipes"
          className="rounded-md px-2 py-1 transition-colors hover:bg-[var(--bay-surface-raised)] hover:text-fd-foreground"
        >
          Recipes
        </Link>
        <Link
          href="/docs/atlas"
          className="rounded-md px-2 py-1 transition-colors hover:bg-[var(--bay-surface-raised)] hover:text-fd-foreground"
        >
          Atlas
        </Link>
        <a
          href={siteConfig.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md px-2 py-1 transition-colors hover:bg-[var(--bay-surface-raised)] hover:text-fd-foreground"
        >
          GitHub
        </a>
      </div>
      <a
        href={siteConfig.npmUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center rounded-md border border-[var(--bay-border)] px-2 py-1 font-[family-name:var(--font-mono)] transition-colors hover:bg-[var(--bay-surface-raised)]"
      >
        npm · remotion-ui
      </a>
    </div>
  );
}
