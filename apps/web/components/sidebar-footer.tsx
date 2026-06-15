import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

/** Docs sidebar footer — external links only; navigation lives in the page tree. */
export function SidebarFooter() {
  return (
    <div className="space-y-3 border-t border-[var(--bay-border)] px-2 py-4 text-xs text-fd-muted-foreground">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/"
          className="rounded-md px-2 py-1 transition-colors hover:bg-[var(--bay-surface-raised)] hover:text-fd-foreground"
        >
          Home
        </Link>
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
