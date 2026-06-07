import { HomeLayout } from "fumadocs-ui/layouts/home";
import Link from "next/link";
import { AtlasBrowse } from "@/components/atlas-browse";
import { HeroPreview } from "@/components/hero-preview";
import { InitCommand } from "@/components/install-command";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogo } from "@/components/site-logo";
import { getAtlasSections } from "@/lib/docs-nav";
import { navLinks, siteConfig } from "@/lib/site-config";

const steps = [
  {
    step: "1",
    title: "Initialize",
    description: "Scaffold a Remotion project with registry aliases.",
  },
  {
    step: "2",
    title: "Add components",
    description: "Copy primitives, scenes, or compositions into your repo.",
  },
  {
    step: "3",
    title: "Compose",
    description: "Import locally and render with Remotion Studio.",
  },
] as const;

export default function HomePage() {
  const atlasSections = getAtlasSections();
  const totalComponents = atlasSections.reduce(
    (count, section) => count + section.items.length,
    0,
  );

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
      <section className="border-b border-fd-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <p className="mb-4 font-[family-name:var(--font-mono)] text-xs font-medium uppercase tracking-[0.18em] text-fd-primary">
              Programmatic video components
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]">
              {siteConfig.tagline}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-fd-muted-foreground">
              {totalComponents} registry components for Remotion — install with
              the CLI, customize every line of source in your project.
            </p>
            <div className="mt-8 max-w-lg">
              <InitCommand />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/docs"
                className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
              >
                Read the docs
              </Link>
              <Link
                href="/docs/atlas"
                className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-muted"
              >
                Browse atlas
              </Link>
            </div>
          </div>
          <HeroPreview />
        </div>
      </section>

      <section className="border-b border-fd-border bg-fd-card/30">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            How it works
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {steps.map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-fd-border bg-fd-card font-[family-name:var(--font-mono)] text-sm font-medium text-fd-primary">
                  {item.step}
                </span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-fd-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <AtlasBrowse
        sections={atlasSections}
        totalComponents={totalComponents}
      />

      <SiteFooter />
    </HomeLayout>
  );
}
