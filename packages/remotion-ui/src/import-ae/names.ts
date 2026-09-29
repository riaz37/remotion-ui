/**
 * Identifiers from AE layer names. Names come from an untrusted file, so
 * nothing but `[A-Za-z0-9]` ever reaches the output as code; the original
 * name only appears inside JSON-escaped strings and sanitised comments.
 */

const RESERVED = new Set(
  (
    "break case catch class const continue debugger default delete do else enum export extends false finally for " +
    "function if implements import in instanceof interface let new null package private protected public return " +
    "static super switch this throw true try typeof var void while with yield await any boolean number string symbol " +
    "undefined NaN Infinity React Fragment Object Array Math JSON Number String Boolean Symbol Error Map Set Promise"
  ).split(" "),
);

function words(name: string): string[] {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
}

const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

/** `"shape layer 1"` → `ShapeLayer1`; falls back when nothing usable is left. */
export function toPascalCase(name: string, fallback = "Layer"): string {
  const pascal = words(name).map(capitalize).join("");
  if (!pascal) return fallback;
  return /^[0-9]/.test(pascal) ? `${fallback}${pascal}` : pascal;
}

export function toCamelCase(name: string, fallback = "layer"): string {
  const pascal = toPascalCase(name, capitalize(fallback));
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function toKebabCase(name: string, fallback = "animation"): string {
  const kebab = words(name)
    .map((w) => w.toLowerCase())
    .join("-");
  return kebab || fallback;
}

/** Hands out identifiers, suffixing a number on collision. */
export class NamePool {
  private readonly taken = new Set<string>(RESERVED);

  constructor(reserved: Iterable<string> = []) {
    for (const name of reserved) this.taken.add(name);
  }

  claim(base: string): string {
    let candidate = base;
    for (let n = 2; this.taken.has(candidate); n += 1) candidate = `${base}${n}`;
    this.taken.add(candidate);
    return candidate;
  }
}
