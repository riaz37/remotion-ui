import Link from "next/link";
import { HeroPreview } from "@/components/hero-preview";
import { CompactInstallCommand } from "@/components/install-command";

const HERO_INSTALL = "npx remotion-ui@latest add social-clip";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[calc(100svh-3.5rem)] items-center overflow-hidden border-b border-fd-border">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.22]"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--color-fd-border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--color-fd-border) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 85% 70% at 50% 0%, black, transparent 72%)",
        }}
      />
      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-14 lg:py-0">
        <div className="order-2 lg:order-1">
          <p className="font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.22em] text-fd-primary">
            Remotion component registry
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-[2.75rem] font-semibold leading-[1.02] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Production-ready
            <span className="block text-fd-muted-foreground">motion.</span>
          </h1>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-fd-muted-foreground">
            Source you own. Install compositions with the CLI.
          </p>
          <div className="mt-7 max-w-md">
            <CompactInstallCommand command={HERO_INSTALL} />
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/docs/components"
              className="inline-flex items-center rounded-lg bg-fd-primary px-4 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
            >
              Browse components
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center rounded-lg border border-fd-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-fd-muted"
            >
              Documentation
            </Link>
          </div>
        </div>
        <div className="order-1 w-full lg:order-2">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}
