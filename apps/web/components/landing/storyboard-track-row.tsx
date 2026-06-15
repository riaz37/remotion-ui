import type { ReactNode } from "react";
import type { AtlasLane } from "@/lib/atlas";
import { ATLAS_LANES } from "@/lib/atlas";
import { laneAccent } from "@/lib/lane-visuals";
import { FilmstripScroll } from "@/components/studio/filmstrip-scroll";

type StoryboardTrackRowProps = {
  trackLabel: string;
  lane: AtlasLane;
  children: ReactNode;
};

export function StoryboardTrackRow({
  trackLabel,
  lane,
  children,
}: StoryboardTrackRowProps) {
  const stripeColor = laneAccent(lane);
  const laneLabel = ATLAS_LANES[lane]?.label ?? trackLabel;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
      <div className="flex shrink-0 items-center gap-2 sm:w-[100px] sm:flex-col sm:items-start sm:justify-center sm:pt-2">
        <div
          className="h-4 w-1 shrink-0 sm:h-8 sm:w-1"
          style={{ backgroundColor: stripeColor }}
          aria-hidden
        />
        <span className="font-[family-name:var(--font-mono)] text-[0.6875rem] text-fd-muted-foreground">
          {trackLabel}
        </span>
        <span className="hidden text-[0.625rem] text-fd-muted-foreground/70 sm:block">
          {laneLabel}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <FilmstripScroll>{children}</FilmstripScroll>
      </div>
    </div>
  );
}
