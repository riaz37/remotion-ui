/**
 * A small pretty-printer for the data literals `import-ae` writes. Values
 * print inline when they fit on a line and break one entry per line when they
 * do not — the layout a person would type, so the output reads like source.
 */

/** A function call in the output, e.g. `rect({ size: [100, 100] })`. */
export class Call {
  constructor(
    readonly fn: string,
    readonly args: readonly unknown[],
  ) {}
}

/** A bare identifier in the output, e.g. a parent layer's const. */
export class Ref {
  constructor(readonly name: string) {}
}

/** An object entry printed with a trailing line comment. */
export class Commented {
  constructor(
    readonly value: unknown,
    readonly comment: string,
  ) {}
}

const MAX_WIDTH = 96;
const INDENT = "  ";

/** Rounded, `-0`-free, no trailing zeros. 4 decimals keeps ease maths exact to the pixel. */
export function formatNumber(value: number, decimals = 4): string {
  if (!Number.isFinite(value)) {
    throw new Error(`import-ae: refusing to print a non-finite number (${value}).`);
  }
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) || rounded === 0 ? "0" : String(rounded);
}

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

// CR, LF and the two Unicode line separators, built from code points so no raw
// separator ever sits in this source file.
const LINE_BREAKS = new RegExp(`[\r\n${String.fromCharCode(0x2028, 0x2029)}]+`, "g");

/** A JSON string literal with U+2028/U+2029 escaped too, so no tool reads a line break into it. */
export function stringLiteral(text: string): string {
  return JSON.stringify(text).replace(LINE_BREAKS_UNICODE, (c) => `\\u${c.charCodeAt(0).toString(16)}`);
}

const LINE_BREAKS_UNICODE = new RegExp(`[${String.fromCharCode(0x2028, 0x2029)}]`, "g");

const formatKey = (key: string) => (IDENTIFIER.test(key) ? key : stringLiteral(key));

/** Text safe inside a `//` or `/* *\/` comment: one line, no comment terminator. */
export function commentSafe(text: string): string {
  return text.replace(/\*\//g, "* /").replace(LINE_BREAKS, " ").trim();
}

function inline(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "number") return formatNumber(value);
  if (typeof value === "string") return stringLiteral(value);
  if (typeof value === "boolean") return String(value);
  if (value instanceof Ref) return value.name;
  if (value instanceof Commented) return inline(value.value);
  if (value instanceof Call) return `${value.fn}(${value.args.map(inline).join(", ")})`;
  if (Array.isArray(value)) return `[${value.map(inline).join(", ")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return "{}";
    return `{ ${entries.map(([k, v]) => `${formatKey(k)}: ${inline(v)}`).join(", ")} }`;
  }
  throw new Error(`import-ae: cannot print a value of type ${typeof value}.`);
}

const hasComment = (value: unknown): boolean => {
  if (value instanceof Commented) return true;
  if (value instanceof Call) return value.args.some(hasComment);
  if (Array.isArray(value)) return value.some(hasComment);
  if (value && typeof value === "object" && !(value instanceof Ref)) {
    return Object.values(value as Record<string, unknown>).some(hasComment);
  }
  return false;
};

/**
 * Print a value starting at `column`, indented by `depth`. Breaks a container
 * only when its inline form would overflow or it carries comments.
 */
export function print(value: unknown, depth = 0, column = depth * INDENT.length): string {
  const flat = inline(value);
  if (!hasComment(value) && column + flat.length <= MAX_WIDTH) return flat;

  const pad = INDENT.repeat(depth + 1);
  const close = INDENT.repeat(depth);
  const line = (text: string, comment?: string) => `${pad}${text},${comment ? ` // ${commentSafe(comment)}` : ""}`;
  const entry = (v: unknown, prefix: string) => {
    const inner = v instanceof Commented ? v.value : v;
    const comment = v instanceof Commented ? v.comment : undefined;
    return line(prefix + print(inner, depth + 1, pad.length + prefix.length), comment);
  };

  if (value instanceof Call) {
    // Keep `fn(` on the line and break the arguments, which reads best for
    // the one-object-argument constructors this printer mostly sees.
    if (value.args.length === 1) return `${value.fn}(${print(value.args[0], depth, column + value.fn.length + 1)})`;
    return `${value.fn}(\n${value.args.map((a) => entry(a, "")).join("\n")}\n${close})`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((v) => entry(v, "")).join("\n")}\n${close}]`;
  }
  if (value && typeof value === "object" && !(value instanceof Ref) && !(value instanceof Commented)) {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return "{}";
    return `{\n${entries.map(([k, v]) => entry(v, `${formatKey(k)}: `)).join("\n")}\n${close}}`;
  }
  return flat;
}
