import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { REGISTRY_ATLAS } from "../registry/atlas";
import { componentReference } from "./component-reference";

/**
 * component-reference.ts documents every prop and default by hand, and it is
 * copied verbatim into the JSON agents read — so drift ships as a lie. For
 * the motion lane this test holds the docs to the source: the prop names come
 * from the component's exported `<Name>Props` type (resolved by the type
 * checker, so intersections count), and defaults from the destructuring
 * pattern of the component itself.
 */
const WEB = join(__dirname, "..");

/** Framework plumbing every component accepts; not worth a doc row each. */
const UNDOCUMENTED_OK = new Set(["style", "className"]);

type RegistryItem = { name: string; files: { path: string }[] };
const registry = JSON.parse(readFileSync(join(WEB, "registry.json"), "utf8")) as { items: RegistryItem[] };

const motionSlugs = Object.entries(REGISTRY_ATLAS)
  .filter(([, meta]) => meta.lane === "motion")
  .map(([slug]) => slug)
  .sort();

const pascal = (slug: string) =>
  slug
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");

const files = Object.fromEntries(
  motionSlugs.map((slug) => {
    const item = registry.items.find((entry) => entry.name === slug);
    return [slug, item ? join(WEB, item.files[0].path) : ""];
  }),
);

function loadProgram(): ts.Program {
  const configPath = join(WEB, "tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, WEB);
  const options = { ...parsed.options, noEmit: true, incremental: false, tsBuildInfoFile: undefined };
  return ts.createProgram(Object.values(files).filter(Boolean), options);
}

const program = loadProgram();
const checker = program.getTypeChecker();

function propNames(file: string, typeName: string): string[] | null {
  const source = program.getSourceFile(file);
  if (!source) return null;
  // Found by declaration, not by scope lookup: scope lookup can return the
  // re-export alias, whose type resolves to `any` and has no properties.
  const declaration = source.statements.find(
    (s): s is ts.TypeAliasDeclaration | ts.InterfaceDeclaration =>
      (ts.isTypeAliasDeclaration(s) || ts.isInterfaceDeclaration(s)) && s.name.text === typeName,
  );
  if (!declaration) return null;
  const type = checker.getTypeAtLocation(declaration.name);
  return checker.getPropertiesOfType(type).map((p) => p.name).sort();
}

/** A default written as a module constant is compared by the constant's value. */
function resolveConstant(source: ts.SourceFile, text: string): string {
  if (!/^[A-Z][A-Z0-9_]*$/.test(text)) return text;
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === text && declaration.initializer) {
        return declaration.initializer.getText(source);
      }
    }
  }
  return text;
}

/** `prop = default` pairs from the component's destructured props parameter. */
function sourceDefaults(file: string, componentName: string): Record<string, string> {
  const source = program.getSourceFile(file);
  const defaults: Record<string, string> = {};
  if (!source) return defaults;
  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === componentName &&
      node.initializer &&
      ts.isArrowFunction(node.initializer)
    ) {
      const [param] = node.initializer.parameters;
      if (param && ts.isObjectBindingPattern(param.name)) {
        for (const element of param.name.elements) {
          const key = element.propertyName?.getText(source) ?? element.name.getText(source);
          if (element.initializer) {
            defaults[key] = resolveConstant(source, element.initializer.getText(source));
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return defaults;
}

const normalise = (value: string) =>
  value
    .replace(/\s+as const$/, "")
    .replace(/\s+/g, " ")
    .replace(/'/g, '"')
    .trim();

describe("motion lane component-reference matches the source", () => {
  it("covers every motion component", () => {
    expect(motionSlugs.length).toBeGreaterThanOrEqual(3);
    for (const slug of motionSlugs) expect(files[slug], `${slug} has no registry file`).toBeTruthy();
  });

  it.each(motionSlugs)("%s documents exactly the props its type declares", (slug) => {
    const names = propNames(files[slug], `${pascal(slug)}Props`);
    expect(names, `${pascal(slug)}Props not found in ${files[slug]}`).not.toBeNull();
    const documented = (componentReference[slug]?.props ?? []).map((p) => p.name).sort();
    const missing = names!.filter((n) => !documented.includes(n) && !UNDOCUMENTED_OK.has(n));
    const phantom = documented.filter((n) => !names!.includes(n));
    expect({ missing, phantom }).toEqual({ missing: [], phantom: [] });
  });

  it.each(motionSlugs)("%s documents the defaults the source uses", (slug) => {
    const defaults = sourceDefaults(files[slug], pascal(slug));
    const mismatches: string[] = [];
    for (const prop of componentReference[slug]?.props ?? []) {
      const actual = defaults[prop.name];
      if (actual === undefined && prop.default !== undefined) {
        mismatches.push(`${prop.name}: documented ${prop.default}, source has none`);
      } else if (actual !== undefined && prop.default === undefined) {
        mismatches.push(`${prop.name}: source default ${actual} is undocumented`);
      } else if (actual !== undefined && normalise(actual) !== normalise(prop.default!)) {
        mismatches.push(`${prop.name}: documented ${prop.default}, source ${actual}`);
      }
    }
    expect(mismatches).toEqual([]);
  });
});
