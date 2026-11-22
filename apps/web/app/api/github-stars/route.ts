import { getGitHubStars } from "@/lib/github-stars";

// Static export: the count is fetched at build time. The client falls back to
// shields.io if this file is missing or empty.
export const dynamic = "force-static";

export async function GET() {
  const stars = await getGitHubStars();
  return Response.json({ stars });
}
