import Link from "next/link";
import { getAtlasMeta, type AtlasLane } from "@/lib/atlas";
import {
  LANE_VISUALS,
  laneAccent,
  laneAccentMuted,
  type LaneVisual,
} from "@/lib/lane-visuals";

type ComponentCardProps = {
  name: string;
  slug: string;
  url: string;
  description?: string;
  lane?: AtlasLane;
};

function LaneThumbnail({ lane }: { lane: AtlasLane }) {
  const visual = LANE_VISUALS[lane];
  const accent = laneAccent(lane);
  const bg = laneAccentMuted(lane);

  return (
    <div
      className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-fd-border"
      style={{ background: bg }}
    >
      <LaneIcon visual={visual} color={accent} />
    </div>
  );
}

function LaneIcon({ visual, color }: { visual: LaneVisual; color: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={visual.iconPath} />
    </svg>
  );
}

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

  return (
    <Link
      href={url}
      className="motion-hover group flex gap-3 rounded-xl border border-fd-border bg-fd-card p-4 hover:border-fd-primary/50 hover:shadow-sm"
    >
      {resolvedLane ? <LaneThumbnail lane={resolvedLane} /> : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium capitalize group-hover:text-fd-primary">
            {displayName}
          </p>
          {meta?.tier === "advanced" ? (
            <span
              className="size-1.5 shrink-0 rounded-full bg-fd-primary"
              title="Advanced"
            />
          ) : null}
        </div>
        {description ? (
          <p className="mt-1 line-clamp-2 text-sm text-fd-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
