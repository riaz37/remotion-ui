import Link from "next/link";
import { Reveal } from "@/components/landing/reveal";
import { PerforationRule } from "@/components/studio/perforation-rule";

/**
 * End slate. The only centered composition on the page, which is what makes it
 * read as an ending rather than another section.
 */
export function EndSlateCta() {
  return (
    <section className="border-b border-[var(--bay-border)] bg-[var(--bay-surface)]">
      <PerforationRule />
      <div className="mx-auto max-w-[680px] px-6 py-[136px] text-center">
        <Reveal>
          <h2 className="text-display-lg">Own the source. Ship the clip.</h2>
        </Reveal>
        <Reveal index={1}>
          <p className="mx-auto mt-4 max-w-md text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
            No runtime dependency. Files land in your project. Render when
            ready.
          </p>
        </Reveal>
        <Reveal index={2}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/installation"
              className="inline-flex items-center rounded-sm border border-[var(--bay-border-strong)] bg-[var(--bay-surface-raised)] px-4 py-2.5 text-sm font-medium text-fd-foreground transition-[border-color,transform] duration-200 hover:border-[var(--bay-phosphor)] active:translate-y-px"
            >
              Get started
            </Link>
            <Link
              href="/docs/components"
              className="link-phosphor inline-flex items-center px-1 py-2.5 text-sm font-medium"
            >
              Browse components
            </Link>
          </div>
        </Reveal>
      </div>
      <PerforationRule />
    </section>
  );
}
