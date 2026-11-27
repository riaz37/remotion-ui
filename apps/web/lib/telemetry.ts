import { z } from "zod";
import { authHeaders, type SupabaseConfig } from "./early-access";

/**
 * Anonymous CLI usage events (see packages/remotion-ui/src/utils/telemetry.ts).
 * The schema is strict so the CLI can never start sending a new field, such as
 * a path, without this file changing too.
 */
export const TELEMETRY_TABLE = "remotionui_cli_events";
export const TELEMETRY_MAX_BYTES = 2048;

export const CLI_COMMANDS = [
  "init",
  "add",
  "doctor",
  "list",
  "search",
  "view",
  "update",
  "diff",
  "import-ae",
  "build",
] as const;

export const telemetryEventSchema = z
  .object({
    command: z.enum(CLI_COMMANDS),
    components: z
      .array(z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/))
      .max(20)
      .default([]),
    ok: z.boolean(),
    cliVersion: z.string().max(40).regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
  })
  .strict();

export type TelemetryEvent = z.infer<typeof telemetryEventSchema>;

export type ParseResult =
  | { ok: true; event: TelemetryEvent }
  | { ok: false; error: string };

export function parseTelemetryBody(raw: string): ParseResult {
  if (raw.length > TELEMETRY_MAX_BYTES) return { ok: false, error: "Body too large." };

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Expected a JSON body." };
  }

  const parsed = telemetryEventSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid event." };
  }
  return { ok: true, event: parsed.data };
}

export async function recordCliEvent(
  event: TelemetryEvent,
  config: SupabaseConfig,
): Promise<void> {
  const response = await fetch(`${config.url}/rest/v1/${TELEMETRY_TABLE}`, {
    method: "POST",
    headers: {
      ...authHeaders(config.serviceKey),
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      command: event.command,
      components: event.components,
      ok: event.ok,
      cli_version: event.cliVersion,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase insert failed (${response.status}): ${body.slice(0, 300)}`);
  }
}
