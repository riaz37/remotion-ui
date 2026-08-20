import { z } from "zod";

/**
 * Where a signup came from. Kept as a closed set so the column stays
 * queryable: "which surface converts" is the only question this table
 * has to answer beyond the raw count.
 */
export const EARLY_ACCESS_SOURCES = [
  "home-section",
  "early-access-page",
  "exit-intent",
] as const;

export type EarlyAccessSource = (typeof EARLY_ACCESS_SOURCES)[number];

const EMAIL_MAX = 254;

export const earlyAccessInputSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(EMAIL_MAX)
    .pipe(z.email({ message: "Enter a valid email address." })),
  source: z.enum(EARLY_ACCESS_SOURCES).default("home-section"),
  /**
   * Honeypot. Real people never see this field, so anything in it is a bot.
   * Validated as "must be empty" rather than stripped, so the route can
   * answer 200 without writing a row.
   */
  company: z.string().max(0).optional(),
});

export type EarlyAccessInput = z.infer<typeof earlyAccessInputSchema>;

export type SignupOutcome = "created" | "duplicate";

export type SignupMeta = {
  referrer?: string | null;
  userAgent?: string | null;
};

type SupabaseConfig = {
  url: string;
  serviceKey: string;
};

export const EARLY_ACCESS_TABLE = "remotionui_early_access";

/**
 * Read at call time, not module scope: a missing key must surface as a 503 at
 * request time rather than crashing the build of every other page.
 */
export function readSupabaseConfig(
  env: Partial<Record<string, string>> = process.env,
): SupabaseConfig | null {
  const url = env.SUPABASE_URL?.trim();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) return null;

  return { url: url.replace(/\/$/, ""), serviceKey };
}

/** Postgres unique-violation. The email is already on the list. */
const UNIQUE_VIOLATION = "23505";

/**
 * Insert straight against PostgREST. The one call we make does not justify
 * pulling the Supabase client (and its bundle) into the web app.
 */
export async function recordSignup(
  input: EarlyAccessInput,
  meta: SignupMeta,
  config: SupabaseConfig,
): Promise<SignupOutcome> {
  const response = await fetch(
    `${config.url}/rest/v1/${EARLY_ACCESS_TABLE}`,
    {
      method: "POST",
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        email: input.email,
        source: input.source,
        referrer: truncate(meta.referrer, 500),
        user_agent: truncate(meta.userAgent, 500),
      }),
    },
  );

  if (response.ok) return "created";

  const body = await response.text();

  if (response.status === 409 || body.includes(UNIQUE_VIOLATION)) {
    return "duplicate";
  }

  throw new Error(
    `Supabase insert failed (${response.status}): ${body.slice(0, 300)}`,
  );
}

function truncate(value: string | null | undefined, max: number) {
  if (!value) return null;
  return value.slice(0, max);
}
