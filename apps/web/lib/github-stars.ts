import { siteConfig } from "@/lib/site-config";

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
    );

    if (!response.ok) return null;

    const data = (await response.json()) as { message?: string };
    const count = Number.parseInt(String(data.message ?? ""), 10);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
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
