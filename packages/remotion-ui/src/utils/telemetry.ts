/**
 * Anonymous usage events: which command ran, which registry components it
 * touched, whether it succeeded, and the CLI version. Nothing else: no paths,
 * project names, IPs we store, or machine ids.
 *
 * Off with REMOTION_UI_TELEMETRY=0 or DO_NOT_TRACK=1, and never sent in CI.
 * REMOTION_UI_TELEMETRY_DEBUG=1 prints the event to stderr instead of sending.
 *
 * Telemetry must never change what the CLI does: every failure here is
 * swallowed on purpose, and the request gives up after a short timeout.
 */
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";

export const TELEMETRY_ENDPOINT = "https://remotionui.com/api/telemetry";

const TIMEOUT_MS = 1500;
const MAX_COMPONENTS = 20;
const COMPONENT_NAME = /^[a-z0-9][a-z0-9-]{0,63}$/;
/** Commands whose positional args are registry component names. */
const COMPONENT_COMMANDS = new Set(["add", "update", "view", "diff"]);
const CI_VARS = [
  "CI",
  "CONTINUOUS_INTEGRATION",
  "BUILD_NUMBER",
  "RUN_ID",
  "GITHUB_ACTIONS",
  "GITLAB_CI",
  "BUILDKITE",
  "CIRCLECI",
  "TF_BUILD",
  "JENKINS_URL",
];
const FALSY = new Set(["0", "false", "off", "no"]);

const NOTICE = [
  "",
  "RemotionUI collects anonymous usage data: the command, registry component",
  "names, success or failure, and the CLI version. No paths or personal data.",
  "Turn it off with REMOTION_UI_TELEMETRY=0 (or DO_NOT_TRACK=1).",
  "Details: https://remotionui.com/docs/cli#telemetry",
  "",
  "",
].join("\n");

export type Env = Partial<Record<string, string>>;

export interface TelemetryEvent {
  command: string;
  components: string[];
  ok: boolean;
  cliVersion: string;
}

export interface CommandRun {
  command: string;
  args: readonly unknown[];
  options: Readonly<Record<string, unknown>>;
  ok: boolean;
  cliVersion: string;
}

export type Post = (endpoint: string, body: string, timeoutMs: number) => Promise<void>;
type Write = (text: string) => void;

function isOn(value: string | undefined): boolean {
  if (value === undefined) return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== "" && !FALSY.has(normalized);
}

export function isTelemetryEnabled(env: Env = process.env): boolean {
  const flag = env.REMOTION_UI_TELEMETRY;
  if (flag !== undefined && FALSY.has(flag.trim().toLowerCase())) return false;
  if (isOn(env.DO_NOT_TRACK)) return false;
  return !CI_VARS.some((key) => isOn(env[key]));
}

function componentNames(args: readonly unknown[]): string[] {
  const names = args
    .flat()
    .filter((arg): arg is string => typeof arg === "string")
    .filter((name) => COMPONENT_NAME.test(name));
  return [...new Set(names)].slice(0, MAX_COMPONENTS);
}

export function buildEvent(run: CommandRun): TelemetryEvent {
  // Names from a custom registry may be private, so only default-registry
  // names are ever sent.
  const sendsNames =
    COMPONENT_COMMANDS.has(run.command) && !run.options.registryUrl;
  return {
    command: run.command,
    components: sendsNames ? componentNames(run.args) : [],
    ok: run.ok,
    cliVersion: run.cliVersion,
  };
}

export function resolveEndpoint(env: Env = process.env): string {
  const override = env.REMOTION_UI_TELEMETRY_URL?.trim();
  if (!override) return TELEMETRY_ENDPOINT;
  try {
    const url = new URL(override);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : TELEMETRY_ENDPOINT;
  } catch {
    return TELEMETRY_ENDPOINT;
  }
}

/**
 * Not fetch: aborting fetch leaves undici's connecting socket open until its
 * own 10s connect timeout, which kept the process alive. Destroying the
 * request closes the socket, so the CLI exits within timeoutMs.
 */
export const postJson: Post = (endpoint, body, timeoutMs) =>
  new Promise((resolve) => {
    const url = new URL(endpoint);
    const client = url.protocol === "http:" ? http : https;
    const request = client.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    });
    const timer = setTimeout(() => request.destroy(), timeoutMs);
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    request.on("response", (response) => {
      response.resume();
      response.on("end", done);
      response.on("error", done);
    });
    request.on("error", done);
    request.end(body);
  });

export async function sendEvent(
  event: TelemetryEvent,
  {
    endpoint,
    post = postJson,
    timeoutMs = TIMEOUT_MS,
  }: { endpoint: string; post?: Post; timeoutMs?: number },
): Promise<void> {
  try {
    await post(endpoint, JSON.stringify(event), timeoutMs);
  } catch {
    // Offline, blocked, slow or down: the command result must not change.
  }
}

function configDir(env: Env): string {
  const base = env.XDG_CONFIG_HOME?.trim() || path.join(os.homedir(), ".config");
  return path.join(base, "remotion-ui");
}

/** Tells the user once, on stderr so `--json` output stays parseable. */
export function showNoticeOnce(
  env: Env = process.env,
  write: Write = (text) => process.stderr.write(text),
): void {
  const dir = configDir(env);
  const file = path.join(dir, "telemetry.json");
  try {
    if (fs.existsSync(file)) return;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      file,
      `${JSON.stringify({ noticeShownAt: new Date().toISOString() })}\n`,
    );
  } catch {
    // Read-only home: still show the notice, it just shows again next time.
  }
  write(NOTICE);
}

export async function recordCommand(
  run: CommandRun,
  {
    env = process.env,
    post,
    write = (text: string) => process.stderr.write(text),
  }: { env?: Env; post?: Post; write?: Write } = {},
): Promise<void> {
  if (!isTelemetryEnabled(env)) return;
  const event = buildEvent(run);
  if (isOn(env.REMOTION_UI_TELEMETRY_DEBUG)) {
    write(`[remotion-ui telemetry] ${JSON.stringify(event)}\n`);
    return;
  }
  showNoticeOnce(env, write);
  await sendEvent(event, { endpoint: resolveEndpoint(env), post });
}
