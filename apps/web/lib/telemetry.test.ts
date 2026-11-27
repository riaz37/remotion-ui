import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseTelemetryBody,
  recordCliEvent,
  TELEMETRY_MAX_BYTES,
  TELEMETRY_TABLE,
} from "./telemetry";

afterEach(() => {
  vi.unstubAllGlobals();
});

const valid = {
  command: "add",
  components: ["social-clip"],
  ok: true,
  cliVersion: "0.10.1",
};

describe("parseTelemetryBody", () => {
  it("accepts a CLI event", () => {
    expect(parseTelemetryBody(JSON.stringify(valid))).toEqual({
      ok: true,
      event: valid,
    });
  });

  it("defaults components to an empty list", () => {
    const { components: _omit, ...rest } = valid;
    const result = parseTelemetryBody(JSON.stringify(rest));
    expect(result.ok && result.event.components).toEqual([]);
  });

  it.each([
    ["unknown command", { ...valid, command: "rm" }],
    ["path as component", { ...valid, components: ["../etc/passwd"] }],
    ["uppercase component", { ...valid, components: ["Intro"] }],
    ["too many components", { ...valid, components: Array.from({ length: 21 }, (_, i) => `c${i}`) }],
    ["bad version", { ...valid, cliVersion: "latest" }],
    ["non-boolean ok", { ...valid, ok: "yes" }],
    ["extra field", { ...valid, cwd: "/Users/me/project" }],
  ])("rejects %s", (_label, body) => {
    expect(parseTelemetryBody(JSON.stringify(body)).ok).toBe(false);
  });

  it("rejects malformed JSON and oversized bodies", () => {
    expect(parseTelemetryBody("{").ok).toBe(false);
    expect(parseTelemetryBody("x".repeat(TELEMETRY_MAX_BYTES + 1)).ok).toBe(false);
  });
});

describe("recordCliEvent", () => {
  it("inserts one row with snake_case columns", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await recordCliEvent(valid, { url: "https://db.test", serviceKey: "sb_secret_x" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://db.test/rest/v1/${TELEMETRY_TABLE}`);
    expect(init.headers.apikey).toBe("sb_secret_x");
    expect(JSON.parse(init.body)).toEqual({
      command: "add",
      components: ["social-clip"],
      ok: true,
      cli_version: "0.10.1",
    });
  });

  it("throws on a failed insert", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 500 })));
    await expect(
      recordCliEvent(valid, { url: "https://db.test", serviceKey: "sb_secret_x" }),
    ).rejects.toThrow(/500/);
  });
});
