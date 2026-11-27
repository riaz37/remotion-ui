/**
 * Cloudflare Pages Function for POST /api/telemetry: anonymous CLI usage
 * events. The CLI ignores the response, so this only answers for debugging.
 * The client IP is used for rate limiting and is never stored.
 * Secrets: SUPABASE_URL and SUPABASE_SECRET_KEY, shared with early-access.
 */
import { readSupabaseConfig } from "../../lib/early-access";
import { checkRateLimit } from "../../lib/rate-limit";
import { parseTelemetryBody, recordCliEvent } from "../../lib/telemetry";

type Env = Partial<Record<string, string>>;

type PagesContext = { request: Request; env: Env };

// A busy session runs a few commands a minute; this only stops floods.
const RATE_LIMIT = { limit: 120, windowMs: 10 * 60 * 1000 };

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const limit = checkRateLimit(`telemetry:${ip}`, RATE_LIMIT);
  if (!limit.allowed) {
    return Response.json(
      { ok: false, error: "Too many events." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const parsed = parseTelemetryBody(await request.text());
  if (!parsed.ok) {
    return Response.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const config = readSupabaseConfig(env);
  if (!config) {
    console.error("[telemetry] SUPABASE_URL/SUPABASE_SECRET_KEY not set");
    return Response.json({ ok: false, error: "Unavailable." }, { status: 503 });
  }

  try {
    await recordCliEvent(parsed.event, config);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[telemetry] insert failed", error);
    return Response.json({ ok: false, error: "Could not record event." }, { status: 500 });
  }
}
