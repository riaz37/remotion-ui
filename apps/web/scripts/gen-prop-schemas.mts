/**
 * Derives a machine-readable JSON Schema for every registry component's props.
 *
 * An agent placing a component into a timeline needs to know what props exist,
 * which values are legal, and which slots can only be filled by JSX. Today that
 * knowledge lives in two places and neither is usable by a machine: the prop
 * types in the TSX (authoritative, but only readable by parsing TypeScript) and
 * `lib/component-reference.ts` (1807 hand-written descriptions, whose `type`
 * field is a free-text display string). Hand-authored `schema` fragments cover
 * 8 of 200 components, and the file's own header warns that `type` and `schema`
 * have to be kept in sync by hand — so authoring the other 192 by hand would
 * multiply that drift by 25 rather than remove it.
 *
 * So the TSX types are the authority here and the reference file supplies only
 * prose: descriptions and documented defaults. The type checker resolves
 * intersections (`MotionPrimitiveProps & {...}`), which is the reason this reads
 * types through a `Program` instead of a regex — a third of the props on a
 * primitive are inherited and invisible to a per-file scan.
 *
 * Props whose type is ReactNode are marked `x-slot`: they are real props but no
 * JSON value can fill them, and an agent that does not know the difference will
 * happily emit `children: "some text"` and render nothing.
 *
 * Run: `pnpm --filter web gen:prop-schemas` (add `--json` for machine output,
 * `--check` to fail on drift instead of writing).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { componentReference } from "../lib/component-reference";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_JSON = path.join(appRoot, "registry.json");
const OUT_PATH = path.join(appRoot, "public", "r", "prop-schemas.json");

const asJson = process.argv.includes("--json");
const checkOnly = process.argv.includes("--check");

type RegistryItem = {
  name: string;
  type: string;
  description?: string;
  files: { path: string }[];
};

type JsonSchema = Record<string, unknown>;

type ComponentSchema = {
  type: "object";
  properties: Record<string, JsonSchema>;
  required?: string[];
};

/**
 * Types that are props but not values an agent can author. ReactNode slots take
 * children; handlers are driven by the host, not the document.
 */
const SLOT_TYPES = new Set([
  "ReactNode",
  "React.ReactNode",
  "ReactElement",
  "React.ReactElement",
  "JSX.Element",
  "ReactNode[]",
]);

function readRegistry(): RegistryItem[] {
  const raw = JSON.parse(readFileSync(REGISTRY_JSON, "utf8")) as {
    items: RegistryItem[];
  };
  return raw.items;
}

/** `fade-in` -> `FadeInProps`, so the right type wins when a file exports several. */
function expectedPropsTypeName(componentName: string): string {
  const pascal = componentName
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return `${pascal}Props`;
}

function primaryTsxFile(item: RegistryItem): string | undefined {
  return item.files.find((file) => file.path.endsWith(".tsx"))?.path;
}

/**
 * Maps a resolved TS type onto JSON Schema. Deliberately shallow: an agent needs
 * to know the shape well enough to emit a legal value, and a fully faithful
 * translation of a nested generic buys nothing it can act on.
 */
/**
 * `boolean` is `true | false` internally, so a naive union walk emits
 * `anyOf: [boolean, boolean]` on every optional flag in the registry.
 */
function dedupe(schemas: JsonSchema[]): JsonSchema[] {
  const seen = new Set<string>();
  return schemas.filter((schema) => {
    const key = JSON.stringify(schema);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collapse(schemas: JsonSchema[], text: string): JsonSchema {
  const unique = dedupe(schemas);
  if (unique.length === 1) return unique[0];
  return { anyOf: unique, "x-type": text };
}

function typeToSchema(
  type: ts.Type,
  checker: ts.TypeChecker,
  depth = 0,
): JsonSchema {
  const text = checker.typeToString(type);

  if (SLOT_TYPES.has(text)) return { "x-slot": true, description: text };

  if (type.flags & ts.TypeFlags.String) return { type: "string" };
  if (type.flags & ts.TypeFlags.Number) return { type: "number" };
  if (type.flags & ts.TypeFlags.Boolean) return { type: "boolean" };
  if (type.flags & ts.TypeFlags.BooleanLiteral) return { type: "boolean" };
  if (type.isStringLiteral()) return { type: "string", const: type.value };
  if (type.isNumberLiteral()) return { type: "number", const: type.value };

  if (type.isUnion()) {
    const parts = type.types.filter(
      (member) =>
        !(member.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)),
    );

    // A union of string literals is an enum, which is the single most useful
    // thing an agent can be told about a prop.
    if (parts.length > 0 && parts.every((member) => member.isStringLiteral())) {
      return {
        type: "string",
        enum: parts.map((member) => (member as ts.StringLiteralType).value),
      };
    }
    // `"smooth" | "snappy" | Partial<SpringConfig> | boolean` — keep the legal
    // literals visible rather than collapsing the whole prop to "unsupported".
    const literals = parts.filter((member) => member.isStringLiteral());
    if (literals.length > 0) {
      return collapse(
        [
          {
            type: "string",
            enum: literals.map((m) => (m as ts.StringLiteralType).value),
          },
          ...parts
            .filter((member) => !member.isStringLiteral())
            .map((member) => typeToSchema(member, checker, depth + 1)),
        ],
        text,
      );
    }
    if (parts.length === 1) return typeToSchema(parts[0], checker, depth + 1);
    return collapse(
      parts.map((member) => typeToSchema(member, checker, depth + 1)),
      text,
    );
  }

  if (checker.isArrayType(type)) {
    const [element] = checker.getTypeArguments(type as ts.TypeReference);
    return {
      type: "array",
      items: element ? typeToSchema(element, checker, depth + 1) : {},
    };
  }

  if (type.getCallSignatures().length > 0) {
    return { "x-unsupported": "function", "x-type": text };
  }

  if (type.flags & ts.TypeFlags.Object) {
    if (depth >= 2) return { type: "object", "x-type": text };
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    for (const symbol of checker.getPropertiesOfType(type)) {
      const memberType = checker.getTypeOfSymbolAtLocation(
        symbol,
        symbol.valueDeclaration ?? symbol.declarations?.[0] ?? (undefined as never),
      );
      properties[symbol.getName()] = typeToSchema(
        memberType,
        checker,
        depth + 1,
      );
      if (!(symbol.flags & ts.SymbolFlags.Optional)) {
        required.push(symbol.getName());
      }
    }
    const schema: JsonSchema = { type: "object", properties };
    if (required.length > 0) schema.required = required;
    return schema;
  }

  return { "x-type": text };
}

type Drift = {
  component: string;
  undocumented: string[];
  stale: string[];
};

function main() {
  const items = readRegistry();
  const fileToItems = new Map<string, RegistryItem[]>();
  for (const item of items) {
    const file = primaryTsxFile(item);
    if (!file) continue;
    const absolute = path.join(appRoot, file);
    const bucket = fileToItems.get(absolute) ?? [];
    bucket.push(item);
    fileToItems.set(absolute, bucket);
  }

  const configPath = ts.findConfigFile(appRoot, ts.sys.fileExists, "tsconfig.json");
  if (!configPath) throw new Error("tsconfig.json not found");
  const parsed = ts.parseJsonConfigFileContent(
    ts.readConfigFile(configPath, ts.sys.readFile).config,
    ts.sys,
    appRoot,
  );

  const program = ts.createProgram({
    rootNames: [...fileToItems.keys()],
    options: { ...parsed.options, noEmit: true },
  });
  const checker = program.getTypeChecker();

  const components: Record<string, ComponentSchema> = {};
  const missingType: string[] = [];
  const drift: Drift[] = [];

  for (const [absolute, bucket] of fileToItems) {
    const source = program.getSourceFile(absolute);
    if (!source) continue;

    for (const item of bucket) {
      const wanted = expectedPropsTypeName(item.name);
      let declaration: ts.TypeAliasDeclaration | ts.InterfaceDeclaration | undefined;
      let fallback: ts.TypeAliasDeclaration | ts.InterfaceDeclaration | undefined;

      ts.forEachChild(source, (node) => {
        if (
          !ts.isTypeAliasDeclaration(node) &&
          !ts.isInterfaceDeclaration(node)
        ) {
          return;
        }
        const name = node.name.text;
        if (!name.endsWith("Props")) return;
        if (name === wanted) declaration = node;
        else if (!fallback) fallback = node;
      });

      const target = declaration ?? fallback;
      if (!target) {
        missingType.push(item.name);
        continue;
      }

      const type = checker.getTypeAtLocation(target.name);
      const reference = componentReference[item.name];
      const documented = new Map(
        (reference?.props ?? []).map((prop) => [prop.name, prop]),
      );

      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];
      const seen = new Set<string>();

      for (const symbol of checker.getPropertiesOfType(type)) {
        const name = symbol.getName();
        seen.add(name);
        const declarationNode =
          symbol.valueDeclaration ?? symbol.declarations?.[0];
        if (!declarationNode) continue;

        const memberType = checker.getTypeOfSymbolAtLocation(
          symbol,
          declarationNode,
        );
        const schema = typeToSchema(memberType, checker);
        const doc = documented.get(name);
        if (doc?.description) schema.description = doc.description;
        if (doc?.default !== undefined) schema.default = doc.default;

        properties[name] = schema;
        const optional = Boolean(symbol.flags & ts.SymbolFlags.Optional);
        if (!optional && doc?.default === undefined) required.push(name);
      }

      const undocumented = [...seen].filter((name) => !documented.has(name));
      const stale = [...documented.keys()].filter((name) => !seen.has(name));
      if (undocumented.length > 0 || stale.length > 0) {
        drift.push({ component: item.name, undocumented, stale });
      }

      const schema: ComponentSchema = { type: "object", properties };
      if (required.length > 0) schema.required = required;
      components[item.name] = schema;
    }
  }

  const payload = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    name: "remotion-ui-prop-schemas",
    generated: "by scripts/gen-prop-schemas.mts — do not edit by hand",
    components,
  };

  if (asJson) {
    console.log(JSON.stringify({ drift, missingType, payload }, null, 2));
    return;
  }

  const propCount = Object.values(components).reduce(
    (total, schema) => total + Object.keys(schema.properties).length,
    0,
  );
  const slotCount = Object.values(components).reduce(
    (total, schema) =>
      total +
      Object.values(schema.properties).filter((prop) => "x-slot" in prop).length,
    0,
  );
  const unsupported = Object.values(components).reduce(
    (total, schema) =>
      total +
      Object.values(schema.properties).filter((prop) => "x-unsupported" in prop)
        .length,
    0,
  );

  console.log(
    `${Object.keys(components).length} components, ${propCount} props ` +
      `(${slotCount} JSX slots, ${unsupported} not agent-settable)`,
  );
  if (missingType.length > 0) {
    console.log(
      `no *Props type: ${missingType.length} (${missingType.join(", ")})`,
    );
  }
  if (drift.length > 0) {
    console.log(`\nreference drift in ${drift.length} components:`);
    for (const entry of drift.slice(0, 20)) {
      const parts = [];
      if (entry.undocumented.length > 0) {
        parts.push(`undocumented: ${entry.undocumented.join(", ")}`);
      }
      if (entry.stale.length > 0) {
        parts.push(`documented but absent: ${entry.stale.join(", ")}`);
      }
      console.log(`  ${entry.component} — ${parts.join(" | ")}`);
    }
    if (drift.length > 20) console.log(`  … ${drift.length - 20} more`);
  }

  if (checkOnly) {
    if (drift.length > 0 || missingType.length > 0) process.exit(1);
    return;
  }

  mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`\nwrote ${path.relative(appRoot, OUT_PATH)}`);
}

main();
