import { getVisitorsThisHour } from "@/lib/vercel-analytics";

/**
 * "N online" from Vercel Web Analytics. The number is visitors in the current
 * UTC clock hour, not a true online-now count: the API only reports hour buckets. Renders nothing when analytics is
 * unconfigured, the request fails, or the hour has no visitors yet.
 */
export async function VisitorsThisHour() {
  const visitors = await getVisitorsThisHour();
  if (!visitors) return null;

  // Monitor tally readout: green live lamp, mono caps, square corners.
  return (
    <p className="inline-flex items-center gap-2.5 rounded-sm border border-[var(--bay-border-strong)] bg-[var(--bay-surface)] px-2.5 py-1 text-mono-xs uppercase text-[var(--bay-muted)]">
      <span aria-hidden className="relative flex size-2">
        <span className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-emerald-600 dark:text-emerald-400">Live</span>
      <span aria-hidden className="h-3 w-px bg-[var(--bay-border-strong)]" />
      <span>
        <span className="tabular-nums text-[var(--bay-ink)]">
          {new Intl.NumberFormat("en-US").format(visitors)}
        </span>{" "}
        online
      </span>
    </p>
  );
}
