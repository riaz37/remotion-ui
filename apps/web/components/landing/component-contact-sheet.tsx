import Link from "next/link";
import { AtlasMiniPreview } from "@/components/atlas-mini-preview";
import { LandingSection } from "@/components/landing/landing-section";
import { Reveal } from "@/components/landing/reveal";
import { getAtlasMeta, type AtlasLane } from "@/lib/atlas";
import { getComponentDocPath } from "@/lib/component-doc-path";
import { LANE_VISUALS, laneAccent } from "@/lib/lane-visuals";
import { previewMeta } from "@/lib/preview-config";

/**
 * A contact sheet: every frame the same size, the subject letterboxed inside,
 * captions under the frame. Twelve slugs, covering all seven lanes so the sheet
 * shows the catalog's range rather than six reels. Twelve divides by 2, 3 and 4,
 * so no breakpoint leaves a hole in the grid.
 */
const SHEET = [
  "data-story",
  "karaoke-captions",
  "terminal-simulator",
  "device-mockup-zoom",
  "social-clip",
  "audiogram-scene",
  "lower-third",
  "grid-pixelate-wipe",
  "ai-generation-canvas",
  "logo-reveal",
  "code-reveal",
  "mesh-gradient-bg",
];

/** Slug words that are acronyms, so `capitalize` does not render them "Ai". */
const ACRONYMS = new Set(["ai", "bg", "cli", "ui", "svg"]);

function displayName(slug: string): string {
  return slug
    .split("-")
    .map((word) => (ACRONYMS.has(word) ? word.toUpperCase() : word))
    .join(" ");
}

function Frame({ slug, index }: { slug: string; index: number }) {
  const lane: AtlasLane = getAtlasMeta(slug)?.lane ?? "reels";
  const name = displayName(slug);
  // Every tile in the sheet defaults to a 16:9 frame, but a handful of
  // compositions (social clips, reels, etc.) are shot 9:16. Squeezing those
  // into a 16:9 tile letterboxes the subject, so the tile's own aspect ratio
  // has to follow the composition's real dimensions instead of a fixed one.
  const { width, height } = previewMeta(slug);
  const aspectRatio = height > width ? "9 / 16" : "16 / 9";

  return (
    <Reveal
      index={index % 4}
      distance={20}
      // The grid stretches every cell in a row to match its tallest sibling
      // by default. A taller 9:16 tile would otherwise drag its 16:9 row
      // neighbors into an oversized cell with dead space under their image,
      // so each tile opts out of stretching and sizes to its own content.
      className="self-start bg-[var(--bay-surface)]"
    >
      <Link
        href={getComponentDocPath(slug)}
        className="group block h-full transition-colors hover:bg-[var(--bay-surface-raised)] focus-visible:bg-[var(--bay-surface-raised)] focus-visible:outline-none"
      >
        <div className="relative bg-[var(--bay-stage)]">
          <div
            className="absolute inset-x-0 top-0 z-10 h-[2px] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            style={{ backgroundColor: laneAccent(lane) }}
            aria-hidden
          />
          <AtlasMiniPreview
            slug={slug}
            lane={lane}
            aspectRatio={aspectRatio}
            scrubOnHover
            playWhenVisible
          />
        </div>

        {/*
          Caption under the frame, the way a contact sheet numbers its strips.
          On hover it turns into the command that installs the frame, so the
          label answers "what is this" and the hover answers "how do I get it".
        */}
        <div className="relative px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2 transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0">
            <span className="truncate text-xs font-medium capitalize text-fd-foreground sm:text-sm">
              {name}
            </span>
            <span className="text-mono-xs hidden shrink-0 text-fd-muted-foreground sm:inline">
              {LANE_VISUALS[lane].label}
            </span>
          </div>
          <div className="absolute inset-0 flex items-center px-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <code className="truncate font-[family-name:var(--font-mono)] text-[0.6875rem] text-[var(--bay-phosphor)]">
              npx remotion-ui add {slug}
            </code>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

export function ComponentContactSheet() {
  return (
    <LandingSection
      title="Components"
      lead="Every frame here is the real composition, running in your browser. Move across one to scrub it."
      layout="wide"
      header="hung"
      rhythm="default"
      action={{ href: "/docs/components", label: "Browse all →" }}
    >
      <div className="overflow-hidden rounded-md border border-[var(--bay-border)] bg-[var(--bay-border)]">
        <div className="grid grid-cols-2 gap-px md:grid-cols-3 lg:grid-cols-4">
          {SHEET.map((slug, index) => (
            <Frame key={slug} slug={slug} index={index} />
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
