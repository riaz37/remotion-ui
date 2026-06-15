import Link from "next/link";
import { AtlasMiniPreview } from "@/components/atlas-mini-preview";
import { ClipCard } from "@/components/studio/clip-card";
import { FilmstripScroll } from "@/components/studio/filmstrip-scroll";
import { PerforationRule } from "@/components/studio/perforation-rule";
import { getComponentDocPath } from "@/lib/component-doc-path";
import { getAtlasMeta } from "@/lib/atlas";

const SHOWCASE_SLUGS = [
  "social-clip",
  "creator-reel",
  "data-story",
  "podcast-clip",
  "hero-loop",
  "showcase",
] as const;

const DURATIONS: Record<string, number> = {
  "social-clip": 228,
  "creator-reel": 398,
  "data-story": 452,
  "podcast-clip": 366,
  "hero-loop": 450,
  showcase: 150,
};

export function StoryboardShowcase() {
  return (
    <section className="border-b border-[var(--bay-border)] py-[120px]">
      <div className="mx-auto max-w-[1120px] px-6">
        <PerforationRule className="mb-16" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-display-lg">The storyboard</h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
              62 compositions, scenes, and primitives — scrub before you install.
            </p>
          </div>
          <Link
            href="/docs/components"
            className="link-phosphor text-sm font-medium"
          >
            Browse all →
          </Link>
        </div>
        <div className="mt-10">
          <FilmstripScroll>
            {SHOWCASE_SLUGS.map((slug) => {
              const meta = getAtlasMeta(slug);
              const lane = meta?.lane ?? "reels";
              const isPortrait =
                slug === "social-clip" ||
                slug === "creator-reel" ||
                slug === "podcast-clip";

              return (
                <ClipCard
                  key={slug}
                  name={slug}
                  url={getComponentDocPath(slug)}
                  durationFrames={DURATIONS[slug]}
                  lane={lane}
                  command={`npx remotion-ui add ${slug}`}
                  className="w-[240px] shrink-0 snap-start"
                  thumbnail={
                    <AtlasMiniPreview
                      slug={slug}
                      lane={lane}
                      scrubOnHover
                      aspectRatio={isPortrait ? "9 / 16" : "16 / 9"}
                    />
                  }
                />
              );
            })}
          </FilmstripScroll>
        </div>
      </div>
    </section>
  );
}
