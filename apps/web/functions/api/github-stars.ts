/**
 * Cloudflare Pages Function for GET /api/github-stars.
 *
 * The site is a static export, so a Next route here would freeze the count at
 * build time. This function fetches it live and caches it at the edge for five
 * minutes. Optional GITHUB_TOKEN in the Pages env raises the GitHub rate limit.
 */
const REPO = "riaz37/remotion-ui";
const TTL_SECONDS = 300;

type Env = Partial<Record<string, string>>;

type PagesContext = {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
};

async function fromGitHub(token: string | undefined): Promise<number | null> {
  const response = await fetch(`https://api.github.com/repos/${REPO}`, {
    headers: {
      Accept: "application/vnd.github+json",
      // GitHub rejects requests without a User-Agent.
      "User-Agent": "remotionui-site",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { stargazers_count?: number };
  return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
}

async function fromShields(): Promise<number | null> {
  const response = await fetch(`https://img.shields.io/github/stars/${REPO}.json`);
  if (!response.ok) return null;
  const data = (await response.json()) as { message?: string };
  const count = Number.parseInt(String(data.message ?? ""), 10);
  return Number.isFinite(count) ? count : null;
}

async function getStars(token: string | undefined): Promise<number | null> {
  try {
    const count = await fromGitHub(token);
    if (count != null) return count;
  } catch (error) {
    console.error("github-stars: GitHub API failed", error);
  }
  try {
    return await fromShields();
  } catch (error) {
    console.error("github-stars: shields fallback failed", error);
    return null;
  }
}

export async function onRequestGet({ request, env, waitUntil }: PagesContext): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(new URL(request.url).origin + "/api/github-stars");

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const stars = await getStars(env.GITHUB_TOKEN);
  const response = Response.json(
    { stars },
    {
      headers: {
        // Never cache a failed lookup.
        "Cache-Control": stars != null ? `public, max-age=${TTL_SECONDS}` : "no-store",
      },
    },
  );

  if (stars != null) waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
