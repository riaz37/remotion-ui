import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-fd-border bg-fd-card/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-display)] text-sm font-semibold">
            {siteConfig.name}
          </p>
          <p className="mt-1 max-w-sm text-sm text-fd-muted-foreground">
            Registry-first motion components for Remotion.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-fd-muted-foreground">
          <Link href="/docs" className="transition-colors hover:text-fd-foreground">
            Docs
          </Link>
          <Link href="/docs/atlas" className="transition-colors hover:text-fd-foreground">
            Atlas
          </Link>
          <Link href="/docs/cli" className="transition-colors hover:text-fd-foreground">
            CLI
          </Link>
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-fd-foreground"
          >
            GitHub
          </a>
          <a
            href={siteConfig.npmUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-fd-border px-2 py-0.5 font-[family-name:var(--font-mono)] text-xs transition-colors hover:bg-fd-muted"
          >
            remotion-ui
          </a>
        </div>
      </div>
    </footer>
  );
}
