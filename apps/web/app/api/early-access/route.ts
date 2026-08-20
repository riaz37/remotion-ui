import {
  earlyAccessInputSchema,
  readSupabaseConfig,
  recordSignup,
} from "@/lib/early-access";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = checkRateLimit(`early-access:${ip}`, RATE_LIMIT);

  if (!limit.allowed) {
    return Response.json(
      { ok: false, error: "Too many attempts. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Expected a JSON body." },
      { status: 400 },
    );
  }

  const parsed = earlyAccessInputSchema.safeParse(payload);

  if (!parsed.success) {
    const filledHoneypot =
      typeof payload === "object" &&
      payload !== null &&
      Boolean((payload as { company?: unknown }).company);

    /*
      A bot that filled the honeypot gets the same answer a person gets. Telling
      it that the field is the trap only teaches it to leave the field alone.
    */
    if (filledHoneypot) {
      return Response.json({ ok: true, status: "created" });
    }

    return Response.json(
      {
        ok: false,
        error:
          parsed.error.issues[0]?.message ?? "Enter a valid email address.",
      },
      { status: 400 },
    );
  }

  const config = readSupabaseConfig();

  if (!config) {
    console.error("[early-access] SUPABASE_URL/SERVICE_ROLE_KEY not set");
    return Response.json(
      {
        ok: false,
        error: "Signups are temporarily unavailable. Try again soon.",
      },
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

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();

  return request.headers.get("x-real-ip") ?? "unknown";
}
