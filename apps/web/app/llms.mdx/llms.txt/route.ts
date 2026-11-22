import { buildLlmsTxt } from "@/lib/llms";


// Served at /llms.txt through a beforeFiles rewrite in next.config.mjs.
export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export const dynamic = "force-static";
