/**
 * Cloudflare Pages Function for POST /api/early-access (the sponsor inquiry
 * form). The site itself is a static export, so this is the one route that
 * still runs code. Secrets come from the Pages project environment:
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import {
  earlyAccessInputSchema,
  readSupabaseConfig,
  recordSignup,
} from "../../lib/early-access";
import { checkRateLimit } from "../../lib/rate-limit";

type Env = Partial<Record<string, string>>;

type PagesContext = { request: Request; env: Env };

const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const limit = checkRateLimit(`early-access:${ip}`, RATE_LIMIT);

  if (!limit.allowed) {
    return Response.json(
      { ok: false, error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Expected a JSON body." }, { status: 400 });
  }

  const parsed = earlyAccessInputSchema.safeParse(payload);

  if (!parsed.success) {
    const filledHoneypot =
      typeof payload === "object" &&
      payload !== null &&
      Boolean((payload as { company?: unknown }).company);

    // A bot that filled the honeypot gets the same answer a person gets.
    if (filledHoneypot) return Response.json({ ok: true, status: "created" });

    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid email address." },
      { status: 400 },
    );
  }

  const config = readSupabaseConfig(env);

  if (!config) {
    console.error("[early-access] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set");
    return Response.json(
      { ok: false, error: "Signups are temporarily unavailable. Try again soon." },
      { status: 503 },
    );
  }

  try {
    const status = await recordSignup(
      parsed.data,
      {
        referrer: request.headers.get("referer"),
        userAgent: request.headers.get("user-agent"),
      },
      config,
    );
    return Response.json({ ok: true, status });
  } catch (error) {
    console.error("[early-access] insert failed", error);
    return Response.json(
      { ok: false, error: "Could not save that right now. Try again soon." },
      { status: 500 },
    );
  }
}
