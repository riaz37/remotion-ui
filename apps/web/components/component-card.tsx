import Link from "next/link";
import { ClipCard } from "@/components/studio/clip-card";
import { getAtlasMeta } from "@/lib/atlas";
import { AtlasMiniPreview } from "@/components/atlas-mini-preview";

type ComponentCardProps = {
  name: string;
  slug: string;
  url: string;
  description?: string;
  lane?: import("@/lib/atlas").AtlasLane;
  durationFrames?: number;
  className?: string;
};

export function ComponentCard({
  name,
  slug,
  url,
  description,
  lane,
  durationFrames,
  className,
}: ComponentCardProps) {
  const meta = getAtlasMeta(slug);
  const resolvedLane = lane ?? meta?.lane;

  if (!resolvedLane) {
    return (
      <Link
        href={url}
        className="motion-border block rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)] p-4 hover:border-[var(--bay-border-strong)]"
      >
        <p className="text-sm font-semibold capitalize">{name.replace(/-/g, " ")}</p>
        {description ? (
          <p className="mt-1 text-sm text-fd-muted-foreground">{description}</p>
        ) : null}
      </Link>
    );
  }

  return (
    <ClipCard
      name={slug}
      url={url}
      lane={resolvedLane}
      durationFrames={durationFrames}
      command={`npx remotion-ui add ${slug}`}
      className={className}
      thumbnail={
        <AtlasMiniPreview slug={slug} lane={resolvedLane} scrubOnHover />
      }
    />
  );
}
