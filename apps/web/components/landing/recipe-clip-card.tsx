import Link from "next/link";
import { AtlasMiniPreview } from "@/components/atlas-mini-preview";
import { getAtlasMeta } from "@/lib/atlas";
import { laneAccent } from "@/lib/lane-visuals";

type RecipeClipCardProps = {
  slug: string;
  title: string;
  components: string[];
  installCommand: string;
  flagshipComposition?: string;
};

const PORTRAIT_SLUGS = new Set(["social-clip", "creator-reel", "podcast-clip"]);

function formatComponentChain(components: string[]): string {
  const maxVisible = 4;
  const visible = components.slice(0, maxVisible);
  const rest = components.length - maxVisible;
  const chain = visible.join(" · ");
  return rest > 0 ? `${chain} · +${rest}` : chain;
}

export function RecipeClipCard({
  slug,
  title,
  components,
  installCommand,
  flagshipComposition,
}: RecipeClipCardProps) {
  const previewSlug = flagshipComposition ?? components[0];
  const meta = previewSlug ? getAtlasMeta(previewSlug) : undefined;
  const lane = meta?.lane ?? "reels";
  const stripeColor = laneAccent(lane);
  const isPortrait = previewSlug ? PORTRAIT_SLUGS.has(previewSlug) : false;

  return (
    <Link
      href={`/docs/recipes/${slug}`}
      className="motion-border flex min-w-[280px] max-w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)] hover:border-[var(--bay-border-strong)]"
    >
      <div className="flex min-h-0">
        <div
          className="w-1 shrink-0"
          style={{ backgroundColor: stripeColor }}
          aria-hidden
        />
        <div
          className="min-w-0 flex-1 bg-[var(--bay-stage)]"
          style={{ aspectRatio: isPortrait ? "9 / 16" : "16 / 9" }}
        >
          {previewSlug ? (
            <AtlasMiniPreview
              slug={previewSlug}
              lane={lane}
              scrubOnHover
              aspectRatio={isPortrait ? "9 / 16" : "16 / 9"}
            />
          ) : null}
        </div>
      </div>
      <div className="border-t border-[var(--bay-border)] px-3 py-3">
        <h3 className="text-base font-semibold text-fd-foreground">{title}</h3>
        <p className="mt-2 line-clamp-2 font-[family-name:var(--font-mono)] text-[0.625rem] leading-relaxed text-fd-muted-foreground">
          {formatComponentChain(components)}
        </p>
        <p className="mt-1 truncate font-[family-name:var(--font-mono)] text-[0.6875rem] text-fd-muted-foreground">
          {installCommand}
        </p>
      </div>
    </Link>
  );
}
