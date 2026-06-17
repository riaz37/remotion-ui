import { AtlasMiniPreview } from "@/components/atlas-mini-preview";
import { ClipCard } from "@/components/studio/clip-card";
import { LandingSection } from "@/components/landing/landing-section";
import { StoryboardTrackRow } from "@/components/landing/storyboard-track-row";
import { getComponentDocPath } from "@/lib/component-doc-path";
import { getAtlasMeta, type AtlasLane } from "@/lib/atlas";

const DURATIONS: Record<string, number> = {
  "social-clip": 228,
  "creator-reel": 390,
  "data-story": 420,
  "podcast-clip": 366,
  "hero-loop": 450,
  showcase: 150,
};

const TRACKS: {
  trackLabel: string;
  lane: AtlasLane;
  slugs: string[];
}[] = [
  {
    trackLabel: "Reels",
    lane: "reels",
    slugs: ["social-clip", "creator-reel", "podcast-clip"],
  },
  {
    trackLabel: "Explainers",
    lane: "blocks",
    slugs: ["data-story", "showcase"],
  },
  {
    trackLabel: "Openers",
    lane: "atoms",
    slugs: ["hero-loop"],
  },
];

function StoryboardClip({ slug }: { slug: string }) {
  const meta = getAtlasMeta(slug);
  const lane = meta?.lane ?? "reels";
  const isPortrait =
    slug === "social-clip" ||
    slug === "creator-reel" ||
    slug === "podcast-clip";

  return (
    <ClipCard
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
}

export function StoryboardShowcase() {
  return (
    <LandingSection
      title="Components"
      lead="Scrub clips before you install — compositions, scenes, and primitives in one catalog."
      layout="wide"
      action={{ href: "/docs/components", label: "Browse all →" }}
    >
      <div className="grid gap-8">
        {TRACKS.map((track) => (
          <StoryboardTrackRow
            key={track.trackLabel}
            trackLabel={track.trackLabel}
            lane={track.lane}
          >
            {track.slugs.map((slug) => (
              <StoryboardClip key={slug} slug={slug} />
            ))}
          </StoryboardTrackRow>
        ))}
      </div>
    </LandingSection>
  );
}
