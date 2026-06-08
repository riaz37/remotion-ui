import Link from "next/link";
import { AtlasMiniPreview } from "@/components/atlas-mini-preview";
import { getAtlasMeta, type AtlasLane } from "@/lib/atlas";
import { ATLAS_LANES } from "@/lib/atlas";
import { laneAccent } from "@/lib/lane-visuals";

type ComponentCardProps = {
  name: string;
  slug: string;
  url: string;
  description?: string;
  lane?: AtlasLane;
};

export function ComponentCard({
  name,
  slug,
  url,
  description,
  lane,
}: ComponentCardProps) {
  const meta = getAtlasMeta(slug);
  const resolvedLane = lane ?? meta?.lane;
  const displayName = name.replace(/-/g, " ");
  const accent = resolvedLane ? laneAccent(resolvedLane) : undefined;

  return (
    <Link
      href={url}
      className="motion-hover group overflow-hidden rounded-2xl border border-fd-border bg-fd-card p-3 hover:border-fd-primary/50 hover:shadow-md hover:shadow-black/10"
    >
      {resolvedLane ? (
        <AtlasMiniPreview slug={slug} lane={resolvedLane} />
      ) : null}
      <div className="mt-3 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-sm font-semibold capitalize group-hover:text-fd-primary">
            {displayName}
          </p>
          <div className="flex shrink-0 gap-1.5">
            {resolvedLane ? (
              <span
                className="rounded-full border px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-medium uppercase tracking-[0.12em]"
                style={{ borderColor: accent, color: accent }}
              >
                {ATLAS_LANES[resolvedLane].label}
              </span>
            ) : null}
            {meta?.tier === "advanced" ? (
              <span className="rounded-full border border-fd-border px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-medium uppercase tracking-[0.12em] text-fd-muted-foreground">
                Pro
              </span>
            ) : null}
          </div>
        </div>
        {description ? (
          <p className="mt-1 line-clamp-2 text-sm text-fd-muted-foreground">
            {description}
          </p>
        ) : meta?.tags?.length ? (
          <p className="mt-1 text-xs capitalize text-fd-muted-foreground">
            {meta.tags.join(" · ")}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
