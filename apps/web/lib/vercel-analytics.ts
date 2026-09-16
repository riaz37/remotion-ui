const ENDPOINT = "https://api.vercel.com/v1/query/web-analytics/visits/aggregate";

export const HOUR_MS = 3_600_000;

export type VisitTotals = { visitors: number; pageviews: number };

/**
 * Production visitors and page views between two instants, from Vercel Web
 * Analytics. The API works in hour buckets: `since` is floored and `until`
 * ceiled to the hour. Uses `aggregate` because `count` returns 0 for ranges
 * that end today. Returns null when unconfigured or on any failure.
 */
export async function queryProductionVisits(
  since: number,
  until: number,
  revalidateSeconds: number,
): Promise<VisitTotals | null> {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  const projectId = process.env.VERCEL_ANALYTICS_PROJECT_ID;
  if (!token || !projectId) return null;

  const params = new URLSearchParams({
    projectId,
    since: String(since),
    until: String(until),
    by: "environment",
    filter: "environment eq 'production'",
  });
  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID;
  if (teamId) params.set("teamId", teamId);

  try {
    const response = await fetch(`${ENDPOINT}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: revalidateSeconds },
    });
    if (!response.ok) {
      console.error(`[vercel-analytics] responded ${response.status}`);
      return null;
    }

    const body = (await response.json()) as {
      data?: { visitors?: number; pageviews?: number }[];
    };
    // An hour with no traffic comes back as an empty data array.
    const row = body.data?.[0] ?? { visitors: 0, pageviews: 0 };
    if (typeof row.visitors !== "number" || typeof row.pageviews !== "number") {
      return null;
    }
    return { visitors: row.visitors, pageviews: row.pageviews };
  } catch (error) {
    console.error("[vercel-analytics] request failed", error);
    return null;
  }
}

const THIS_HOUR_TTL_SECONDS = 60;

/** Production visitors in the current clock hour (UTC), refreshed each minute. */
export async function getVisitorsThisHour(): Promise<number | null> {
  const hourStart = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;
  const totals = await queryProductionVisits(
    hourStart,
    hourStart + HOUR_MS,
    THIS_HOUR_TTL_SECONDS,
  );
  return totals?.visitors ?? null;
}
