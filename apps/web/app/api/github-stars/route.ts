import { getGitHubStars } from "@/lib/github-stars";

export const dynamic = "force-dynamic";

export async function GET() {
  const stars = await getGitHubStars();

  return Response.json(
    { stars },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
