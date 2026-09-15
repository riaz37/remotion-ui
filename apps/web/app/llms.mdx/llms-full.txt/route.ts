import { buildLlmsFullTxt } from "@/lib/llms";

export const revalidate = false;

// Served at /llms-full.txt through a beforeFiles rewrite in next.config.mjs.
export async function GET() {
  return new Response(await buildLlmsFullTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
