import { HomeLayout } from "fumadocs-ui/layouts/home";
import Link from "next/link";
import { HeroPreview } from "@/components/hero-preview";
import { InitCommand } from "@/components/install-command";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogo } from "@/components/site-logo";
import { getComponentSections } from "@/lib/docs-nav";
import { navLinks, siteConfig } from "@/lib/site-config";

const features = [
  {
    title: "Own the source",
    description:
      "Components copy into your repo. No black-box dependency — edit, extend, and ship.",
  },
  {
    title: "Live previews",
    description:
      "Every component page includes a Remotion Player demo so you see motion before you install.",
  },
  {
    title: "CLI workflow",
    description:
      "init, add, search, diff, and update — a registry workflow built for motion projects.",
  },
] as const;

export default function HomePage() {
  const sections = getComponentSections();
  const totalComponents = sections.reduce(
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
      <section className="relative overflow-hidden border-b border-fd-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.72_0.14_48/0.18),transparent)]"
        />
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-fd-primary">
              Video components for Remotion
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]">
              {siteConfig.tagline}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-fd-muted-foreground">
              Registry-first motion components for Remotion. {totalComponents}{" "}
              primitives, scenes, and compositions — install with the CLI,
              customize the source in your repo.
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
                href="/docs/primitives/fade-in"
                className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-muted"
              >
                Browse components
              </Link>
            </div>
          </div>
          <HeroPreview />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-fd-border bg-fd-card p-6 shadow-sm"
            >
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        {sections.map((section) => (
          <div key={section.title} className="mb-14 last:mb-0">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
                  {section.title}
                </h2>
                <p className="mt-1 text-sm text-fd-muted-foreground">
                  {section.items.length} components
                </p>
              </div>
              <Link
                href={section.basePath}
                className="text-sm font-medium text-fd-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <Link
                  key={item.slug}
                  href={item.url}
                  className="group rounded-xl border border-fd-border bg-fd-card p-4 transition-all hover:border-fd-primary/40 hover:shadow-md"
                >
                  <p className="font-medium group-hover:text-fd-primary">
                    {item.name}
                  </p>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-fd-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <SiteFooter />
    </HomeLayout>
  );
}
