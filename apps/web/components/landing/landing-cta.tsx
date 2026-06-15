import Link from "next/link";
import { PerforationRule } from "@/components/studio/perforation-rule";

export function LandingCta() {
  return (
    <section className="py-[120px]">
      <div className="mx-auto max-w-[680px] px-6 text-center">
        <PerforationRule className="mb-16" />
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
            Open storyboard
          </Link>
        </div>
      </div>
    </section>
  );
}
