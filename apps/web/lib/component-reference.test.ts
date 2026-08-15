import Ajv from "ajv";
import { describe, expect, it } from "vitest";
import { componentReference } from "./component-reference";

// Flagship components authored with `schema` in Workstream 3 of the agent-native plan,
// plus the expansion foundations — those are the entries other components are meant to
// be composed against, so an agent reading the reference needs their prop types machine
// -readable. Full coverage across the whole catalog is a backlog item, not a bug here.
const FLAGSHIP_COMPONENTS = [
  "social-clip",
  "creator-reel",
  "intro",
  "fade-in",
  "caption-highlight",
  "split-text-chars",
  "audio-reactive-scale",
  "srt-caption-track",
] as const;

const ajv = new Ajv({ strict: false });

describe("component-reference prop schemas", () => {
  it.each(FLAGSHIP_COMPONENTS)(
    "every prop on %s has a schema fragment",
    (name) => {
      const reference = componentReference[name];
      expect(reference, `missing componentReference entry for ${name}`).toBeDefined();

      for (const prop of reference!.props) {
        expect(
          prop.schema,
          `${name}.${prop.name} is missing a schema fragment`,
        ).toBeDefined();
      }
    },
  );

  it.each(FLAGSHIP_COMPONENTS)(
    "every schema fragment on %s is a structurally valid JSON Schema",
    (name) => {
      const reference = componentReference[name]!;

      for (const prop of reference.props) {
        if (!prop.schema) continue;

        // Ajv.compile throws on a malformed JSON Schema (bad keyword combos, invalid
        // types, etc). It doesn't validate a sample value — it validates the schema
        // itself is well-formed, which is what catches hand-authoring typos.
        expect(
          () => ajv.compile(prop.schema as Record<string, unknown>),
          `${name}.${prop.name} has an invalid JSON Schema fragment: ${JSON.stringify(prop.schema)}`,
        ).not.toThrow();
      }
    },
  );

  it("does not fabricate schema on components outside the flagship list", () => {
    // Not a hard requirement, just a guard against silently overreaching scope: if this
    // starts failing because another component legitimately grew a `schema` field,
    // update FLAGSHIP_COMPONENTS above rather than treating this as a regression.
    const withSchema = Object.entries(componentReference)
      .filter(([, reference]) => reference.props.some((prop) => prop.schema))
      .map(([componentName]) => componentName);

    expect(new Set(withSchema)).toEqual(new Set(FLAGSHIP_COMPONENTS));
  });
});
