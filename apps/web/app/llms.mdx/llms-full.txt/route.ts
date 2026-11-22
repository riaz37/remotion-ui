import { buildLlmsFullTxt } from "@/lib/llms";


// Served at /llms-full.txt through a beforeFiles rewrite in next.config.mjs.
export async function GET() {
  return new Response(await buildLlmsFullTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export const dynamic = "force-static";
