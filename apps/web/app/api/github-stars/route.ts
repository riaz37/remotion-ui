import { STARS_TTL_SECONDS, getGitHubStars } from "@/lib/github-stars";

export const revalidate = 3600;

export async function GET() {
  const stars = await getGitHubStars();

  return Response.json(
    { stars },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${STARS_TTL_SECONDS}, stale-while-revalidate=86400`,
      },
    },
  );
}
