import { HomeLayout } from "fumadocs-ui/layouts/home";
import Link from "next/link";
import { HeroPreview } from "@/components/hero-preview";
import { InitCommand } from "@/components/install-command";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogo } from "@/components/site-logo";
import { navLinks, siteConfig } from "@/lib/site-config";

export default function HomePage() {
  return (
    <HomeLayout
      nav={{
        title: <SiteLogo />,
        url: "/",
      }}
      githubUrl={siteConfig.githubUrl}
      links={navLinks.map((link) => ({
        text: link.text,
        url: link.url,
        active: link.active,
      }))}
      className="flex flex-1 flex-col"
    >
      <section className="relative overflow-hidden border-b border-fd-border">
        <div className="absolute left-1/2 top-0 -z-10 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-fd-primary/10 blur-3xl" />
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-24">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-fd-primary/30 bg-fd-primary/10 px-3 py-1 font-[family-name:var(--font-mono)] text-xs font-medium uppercase tracking-[0.16em] text-fd-primary">
                Remotion component registry
              </span>
              <span className="rounded-full border border-fd-border bg-fd-card px-3 py-1 text-xs font-medium text-fd-muted-foreground">
                Copy-paste motion components
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]">
              Copy production-ready motion into your Remotion videos.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-fd-muted-foreground">
              Animated captions, counters, transitions, charts, scenes, and reel
              templates that install as source you own. Preview the motion,
              copy the component, then tune every frame.
            </p>
            <div className="mt-8 max-w-lg">
              <InitCommand />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/docs"
                className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
              >
                Start building
              </Link>
              <Link
                href="/docs/atlas"
                className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-muted"
              >
                Watch the atlas
              </Link>
            </div>
            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-fd-border bg-fd-card/70 p-3">
                <p className="font-[family-name:var(--font-mono)] text-xs text-fd-primary">
                  01
                </p>
                <p className="mt-1 font-medium">Source-owned</p>
              </div>
              <div className="rounded-xl border border-fd-border bg-fd-card/70 p-3">
                <p className="font-[family-name:var(--font-mono)] text-xs text-fd-primary">
                  30fps
                </p>
                <p className="mt-1 font-medium">Frame-true</p>
              </div>
              <div className="rounded-xl border border-fd-border bg-fd-card/70 p-3">
                <p className="font-[family-name:var(--font-mono)] text-xs text-fd-primary">
                  CLI
                </p>
                <p className="mt-1 font-medium">Copy-paste</p>
              </div>
            </div>
          </div>
          <HeroPreview />
        </div>
      </section>

      <SiteFooter />
    </HomeLayout>
  );
}
