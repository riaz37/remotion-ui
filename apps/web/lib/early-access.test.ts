import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EARLY_ACCESS_TABLE,
  earlyAccessInputSchema,
  readSupabaseConfig,
  recordSignup,
} from "./early-access";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("earlyAccessInputSchema", () => {
  it("normalises case and surrounding whitespace", () => {
    const parsed = earlyAccessInputSchema.parse({
      email: "  Riaz@Example.COM ",
    });

    expect(parsed.email).toBe("riaz@example.com");
  });

  it("defaults the source when the client omits it", () => {
    expect(earlyAccessInputSchema.parse({ email: "a@b.co" }).source).toBe(
      "home-section",
    );
  });

  it("rejects addresses that are not addresses", () => {
    for (const email of ["", "nope", "a@b", "a b@c.com", "@example.com"]) {
      expect(earlyAccessInputSchema.safeParse({ email }).success).toBe(false);
    }
  });

  it("rejects an unknown source rather than storing it", () => {
    const result = earlyAccessInputSchema.safeParse({
      email: "a@b.co",
      source: "twitter-dm",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    const result = earlyAccessInputSchema.safeParse({
      email: "a@b.co",
      company: "Acme Inc",
    });

    expect(result.success).toBe(false);
  });
});

describe("readSupabaseConfig", () => {
  it("returns null when either half of the credential pair is missing", () => {
    expect(readSupabaseConfig({ SUPABASE_URL: "https://x.supabase.co" })).toBe(
      null,
    );
    expect(readSupabaseConfig({ SUPABASE_SERVICE_ROLE_KEY: "key" })).toBe(null);
    expect(readSupabaseConfig({})).toBe(null);
  });

  it("strips a trailing slash so the REST path never doubles up", () => {
    const config = readSupabaseConfig({
      SUPABASE_URL: "https://x.supabase.co/",
      SUPABASE_SERVICE_ROLE_KEY: " key ",
    });

    expect(config).toEqual({ url: "https://x.supabase.co", serviceKey: "key" });
  });
});

describe("recordSignup", () => {
  const config = { url: "https://x.supabase.co", serviceKey: "service-key" };
  const input = earlyAccessInputSchema.parse({
    email: "riaz@example.com",
    source: "exit-intent",
  });

  it("posts the row to PostgREST with the service credentials", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const outcome = await recordSignup(
      input,
      { referrer: "https://remotionui.com/", userAgent: "vitest" },
      config,
    );

    expect(outcome).toBe("created");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      `https://x.supabase.co/rest/v1/${EARLY_ACCESS_TABLE}`,
    );
    expect((init.headers as Record<string, string>).apikey).toBe("service-key");
    expect(JSON.parse(init.body as string)).toEqual({
      email: "riaz@example.com",
      source: "exit-intent",
      referrer: "https://remotionui.com/",
      user_agent: "vitest",
    });
  });

  it("reads a unique violation as an existing signup, not a failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ code: "23505" }), { status: 409 }),
      ),
    );

    await expect(recordSignup(input, {}, config)).resolves.toBe("duplicate");
  });

  it("throws on any other failure so the route can answer 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("permission denied", { status: 401 })),
    );

    await expect(recordSignup(input, {}, config)).rejects.toThrow(/401/);
  });

  it("stores null rather than empty strings for missing metadata", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await recordSignup(input, { referrer: null, userAgent: undefined }, config);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({
      referrer: null,
      user_agent: null,
    });
  });
});
