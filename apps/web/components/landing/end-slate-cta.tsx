import Link from "next/link";
import { PerforationRule } from "@/components/studio/perforation-rule";

export function EndSlateCta() {
  return (
    <section className="border-b border-[var(--bay-border)] bg-[var(--bay-surface)]">
      <PerforationRule />
      <div className="mx-auto max-w-[680px] px-6 py-[120px] text-center">
        <div>
          <h2 className="text-display-lg">Own the source. Ship the clip.</h2>
          <p className="mx-auto mt-4 max-w-md text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
            No runtime dependency. Files land in your project. Render when ready.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/installation"
              className="inline-flex items-center rounded-sm border border-[var(--bay-border-strong)] bg-[var(--bay-surface-raised)] px-4 py-2.5 text-sm font-medium text-fd-foreground transition-colors hover:border-[var(--bay-phosphor)]"
            >
              Get started
            </Link>
            <Link
              href="/docs/components"
              className="link-phosphor inline-flex items-center px-1 py-2.5 text-sm font-medium"
            >
              Open components
            </Link>
          </div>
        </div>
      </div>
      <PerforationRule />
    </section>
  );
}
