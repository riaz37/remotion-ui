import { siteConfig } from "@/lib/site-config";

export const STARS_TTL_SECONDS = 3600;

export const githubRepo = siteConfig.githubUrl.replace("https://github.com/", "");

export function formatGitHubStars(count: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(count);
}

async function getGitHubStarsFromShields(): Promise<number | null> {
  try {
    const response = await fetch(
      `https://img.shields.io/github/stars/${githubRepo}.json`,
      { next: { revalidate: STARS_TTL_SECONDS } },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as { message?: string };
    const count = Number.parseInt(String(data.message ?? ""), 10);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}

async function getGitHubStarsFromApi(): Promise<number | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${githubRepo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      next: { revalidate: STARS_TTL_SECONDS },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

export async function getGitHubStars(): Promise<number | null> {
  const fromApi = await getGitHubStarsFromApi();
  if (fromApi != null) return fromApi;

  return getGitHubStarsFromShields();
}

export async function fetchGitHubStarsClient(): Promise<number | null> {
  try {
    const response = await fetch("/api/github-stars");
    if (response.ok) {
      const data = (await response.json()) as { stars?: number | null };
      if (typeof data.stars === "number") return data.stars;
    }
  } catch {
    // Fall through to shields fallback.
  }

  return getGitHubStarsFromShields();
}
