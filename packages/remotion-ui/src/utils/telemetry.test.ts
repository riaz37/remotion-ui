import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildEvent,
  isTelemetryEnabled,
  postJson,
  recordCommand,
  resolveEndpoint,
  sendEvent,
  showNoticeOnce,
  TELEMETRY_ENDPOINT,
} from "./telemetry.js";

const event = {
  command: "add",
  components: ["social-clip"],
  ok: true,
  cliVersion: "0.10.1",
};

describe("isTelemetryEnabled", () => {
  it("is on with a clean environment", () => {
    expect(isTelemetryEnabled({})).toBe(true);
  });

  it.each([
    ["REMOTION_UI_TELEMETRY", "0"],
    ["REMOTION_UI_TELEMETRY", "false"],
    ["REMOTION_UI_TELEMETRY", "OFF"],
    ["DO_NOT_TRACK", "1"],
    ["DO_NOT_TRACK", "true"],
    ["CI", "true"],
    ["CI", "1"],
    ["GITHUB_ACTIONS", "true"],
    ["BUILDKITE", "true"],
  ])("is off when %s=%s", (key, value) => {
    expect(isTelemetryEnabled({ [key]: value })).toBe(false);
  });

  it.each([
    ["DO_NOT_TRACK", "0"],
    ["DO_NOT_TRACK", ""],
    ["CI", "false"],
    ["REMOTION_UI_TELEMETRY", "1"],
  ])("stays on when %s=%s", (key, value) => {
    expect(isTelemetryEnabled({ [key]: value })).toBe(true);
  });

  it("cannot be forced on in CI", () => {
    expect(isTelemetryEnabled({ REMOTION_UI_TELEMETRY: "1", CI: "true" })).toBe(
      false,
    );
  });
});

describe("buildEvent", () => {
  it("keeps registry component names for component commands", () => {
    expect(
      buildEvent({
        command: "add",
        args: [["social-clip", "intro"]],
        options: {},
        ok: true,
        cliVersion: "0.10.1",
      }),
    ).toEqual({
      command: "add",
      components: ["social-clip", "intro"],
      ok: true,
      cliVersion: "0.10.1",
    });
  });

  it("drops anything that is not a plain component name", () => {
    const built = buildEvent({
      command: "add",
      args: ["./src/secret.tsx", "/Users/me/x", "Intro", "a b", "ok-name"],
      options: {},
      ok: true,
      cliVersion: "0.10.1",
    });
    expect(built.components).toEqual(["ok-name"]);
  });

  it("dedupes and caps the component list", () => {
    const names = Array.from({ length: 30 }, (_, i) => `c${i}`);
    const built = buildEvent({
      command: "add",
      args: [...names, "c0"],
      options: {},
      ok: true,
      cliVersion: "0.10.1",
    });
    expect(built.components).toHaveLength(20);
    expect(new Set(built.components).size).toBe(20);
  });

  it("sends no component names from a custom registry", () => {
    const built = buildEvent({
      command: "add",
      args: ["acme-private-logo"],
      options: { registryUrl: "https://acme.internal/r" },
      ok: true,
      cliVersion: "0.10.1",
    });
    expect(built.components).toEqual([]);
  });

  it("never sends positional args of other commands", () => {
    expect(
      buildEvent({
        command: "init",
        args: ["my-video"],
        options: {},
        ok: false,
        cliVersion: "0.10.1",
      }).components,
    ).toEqual([]);
    expect(
      buildEvent({
        command: "import-ae",
        args: ["anim"],
        options: {},
        ok: true,
        cliVersion: "0.10.1",
      }).components,
    ).toEqual([]);
  });
});

describe("resolveEndpoint", () => {
  it("defaults to the RemotionUI site", () => {
    expect(resolveEndpoint({})).toBe(TELEMETRY_ENDPOINT);
  });

  it("accepts an http(s) override", () => {
    expect(
      resolveEndpoint({ REMOTION_UI_TELEMETRY_URL: "http://localhost:8788/api/telemetry" }),
    ).toBe("http://localhost:8788/api/telemetry");
  });

  it("ignores a malformed or non-http override", () => {
    expect(resolveEndpoint({ REMOTION_UI_TELEMETRY_URL: "not a url" })).toBe(
      TELEMETRY_ENDPOINT,
    );
    expect(resolveEndpoint({ REMOTION_UI_TELEMETRY_URL: "file:///etc/passwd" })).toBe(
      TELEMETRY_ENDPOINT,
    );
  });
});

describe("sendEvent", () => {
  it("posts the event as JSON", async () => {
    const post = vi.fn().mockResolvedValue(undefined);
    await sendEvent(event, { endpoint: "https://x.test/api", post });
    expect(post).toHaveBeenCalledOnce();
    const [url, body, timeoutMs] = post.mock.calls[0];
    expect(url).toBe("https://x.test/api");
    expect(JSON.parse(body)).toEqual(event);
    expect(timeoutMs).toBeGreaterThan(0);
  });

  it("never throws when the transport fails", async () => {
    const post = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(
      sendEvent(event, { endpoint: "https://x.test/api", post }),
    ).resolves.toBeUndefined();
  });
});

describe("postJson", () => {
  let server: http.Server;
  let received: string[];
  let respond: boolean;

  beforeEach(async () => {
    received = [];
    respond = true;
    server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        received.push(body);
        if (respond) res.writeHead(204).end();
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  });

  afterEach(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  const endpoint = () =>
    `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/telemetry`;

  it("delivers the body", async () => {
    await postJson(endpoint(), JSON.stringify(event), 1000);
    expect(received.map((b) => JSON.parse(b))).toEqual([event]);
  });

  it("gives up and closes the socket when the server never answers", async () => {
    respond = false;
    const started = Date.now();
    await postJson(endpoint(), JSON.stringify(event), 100);
    expect(Date.now() - started).toBeLessThan(1000);
    await new Promise((resolve) => setTimeout(resolve, 50));
    const open = await new Promise<number>((resolve) =>
      server.getConnections((_err, count) => resolve(count)),
    );
    expect(open).toBe(0);
  });

  it("resolves when nothing is listening", async () => {
    const url = endpoint();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await expect(postJson(url, "{}", 500)).resolves.toBeUndefined();
    server = http.createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  });
});

describe("showNoticeOnce / recordCommand", () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "rui-telemetry-"));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("prints the notice only on the first run", () => {
    const write = vi.fn();
    const env = { XDG_CONFIG_HOME: dir };
    showNoticeOnce(env, write);
    showNoticeOnce(env, write);
    expect(write).toHaveBeenCalledOnce();
    expect(write.mock.calls[0][0]).toContain("REMOTION_UI_TELEMETRY=0");
    expect(fs.existsSync(path.join(dir, "remotion-ui", "telemetry.json"))).toBe(true);
  });

  it("sends nothing and writes nothing when disabled", async () => {
    const post = vi.fn();
    const write = vi.fn();
    await recordCommand(
      { command: "add", args: ["intro"], options: {}, ok: true, cliVersion: "0.10.1" },
      { env: { DO_NOT_TRACK: "1", XDG_CONFIG_HOME: dir }, post, write },
    );
    expect(post).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it("prints the event instead of sending it in debug mode", async () => {
    const post = vi.fn();
    const write = vi.fn();
    await recordCommand(
      { command: "add", args: ["intro"], options: {}, ok: true, cliVersion: "0.10.1" },
      {
        env: { REMOTION_UI_TELEMETRY_DEBUG: "1", XDG_CONFIG_HOME: dir },
        post,
        write,
      },
    );
    expect(post).not.toHaveBeenCalled();
    expect(write.mock.calls[0][0]).toContain('"components":["intro"]');
  });

  it("shows the notice and sends the event when enabled", async () => {
    const post = vi.fn().mockResolvedValue(undefined);
    const write = vi.fn();
    await recordCommand(
      { command: "search", args: [], options: {}, ok: true, cliVersion: "0.10.1" },
      { env: { XDG_CONFIG_HOME: dir }, post, write },
    );
    expect(write).toHaveBeenCalledOnce();
    expect(post).toHaveBeenCalledOnce();
    expect(JSON.parse(post.mock.calls[0][1])).toEqual({
      command: "search",
      components: [],
      ok: true,
      cliVersion: "0.10.1",
    });
  });
});
