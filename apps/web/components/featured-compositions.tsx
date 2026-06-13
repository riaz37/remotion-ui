import Link from "next/link";
import { ComponentCard } from "@/components/component-card";
import { getAtlasSections } from "@/lib/docs-nav";

const FEATURED_SLUGS = [
  "social-clip",
  "creator-reel",
  "intro",
  "podcast-clip",
  "tutorial-clip",
  "hero-loop",
] as const;

export function FeaturedCompositions() {
  const sections = getAtlasSections();
  const items = sections
    .flatMap((section) => section.items)
    .filter((item) =>
      FEATURED_SLUGS.includes(item.slug as (typeof FEATURED_SLUGS)[number]),
    )
    .sort(
      (a, b) =>
        FEATURED_SLUGS.indexOf(a.slug as (typeof FEATURED_SLUGS)[number]) -
        FEATURED_SLUGS.indexOf(b.slug as (typeof FEATURED_SLUGS)[number]),
    );

  return (
    <section className="border-b border-fd-border bg-fd-card/30">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
              Featured compositions
            </h2>
            <p className="mt-1 text-sm text-fd-muted-foreground">
              Full 9:16 and launch templates: install, edit source, render.
            </p>
          </div>
          <Link
            href="/docs/components"
            className="text-sm font-medium text-fd-primary transition-opacity hover:opacity-80"
          >
            Browse all components →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ComponentCard
              key={item.slug}
              name={item.name}
              slug={item.slug}
              url={item.url}
              description={item.description}
              lane={item.lane}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
