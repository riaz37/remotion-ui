import { HOUR_MS, queryProductionVisits, type VisitTotals } from "@/lib/vercel-analytics";

export const TRAFFIC_TTL_SECONDS = 3600;

const WINDOW_DAYS = 30;

export type TrafficStat = { label: string; value: string };

export type SponsorTraffic = {
  stats: TrafficStat[];
  /** true when the numbers came from the API, false for the snapshot below. */
  live: boolean;
};

/**
 * Hand-copied snapshot (production, 30 days to 2026-09-15). Shown only when
 * the analytics token is missing or the API call fails.
 */
const SNAPSHOT = { visitors: 2187, pageviews: 25886 };

const formatCount = (n: number) => new Intl.NumberFormat("en-US").format(n);

function toStats(visitors: number, pageviews: number): TrafficStat[] {
  const perVisit = visitors > 0 ? Math.round(pageviews / visitors) : 0;
  return [
    { label: "Visitors", value: formatCount(visitors) },
    { label: "Page views", value: formatCount(pageviews) },
    { label: "Pages per visit", value: `~${perVisit}` },
  ];
}

/**
 * Trailing 30 days. The window is floored to the hour so the request URL, and
 * therefore the fetch cache entry, stays stable within each revalidation window.
 */
async function fetchLiveTraffic(): Promise<VisitTotals | null> {
  const until = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;
  return queryProductionVisits(until - WINDOW_DAYS * 24 * HOUR_MS, until, TRAFFIC_TTL_SECONDS);
}

export async function getSponsorTraffic(): Promise<SponsorTraffic> {
  const live = await fetchLiveTraffic();
  if (live) return { stats: toStats(live.visitors, live.pageviews), live: true };
  return { stats: toStats(SNAPSHOT.visitors, SNAPSHOT.pageviews), live: false };
}
