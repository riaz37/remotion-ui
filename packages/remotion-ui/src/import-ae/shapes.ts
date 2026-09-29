import { Call } from "./printer.js";
import {
  at,
  readColor,
  readGradient,
  readPath,
  readPosition,
  readScalar,
  readStaticNumber,
  readVector,
  report,
  type Loc,
  type ReadContext,
} from "./properties.js";
import { invalid, LIMITS, shapeItemSchema, validate } from "./schema.js";

/**
 * Lottie shape items → `lottie-shapes` constructor calls. Every item either
 * becomes code or lands in the import report; nothing is dropped quietly.
 */

type Item = Record<string, unknown>;

const LINE_CAP: Record<number, string> = { 1: "butt", 2: "round", 3: "square" };
const LINE_JOIN: Record<number, string> = { 1: "miter", 2: "round", 3: "bevel" };

const UNSUPPORTED_ITEMS: Record<string, string> = {
  rd: "Round Corners",
  mm: "Merge Paths",
  tw: "Twist",
  ms: "Mouse modifier",
};

/** Drop keys whose value equals the runtime default, so output stays short. */
function withoutDefaults(spec: Record<string, unknown>, defaults: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(spec).filter(([key, value]) => {
      if (value === undefined) return false;
      if (!(key in defaults)) return true;
      return JSON.stringify(value) !== JSON.stringify(defaults[key]);
    }),
  );
}

const optional = <T>(value: unknown, read: () => T): T | undefined => (value === undefined ? undefined : read());

/** A Transform group: anchor, position, scale, rotation, opacity, skew. */
export function readTransform(tr: Item | undefined, ctx: ReadContext, loc: Loc): Record<string, unknown> | undefined {
  if (!tr) return undefined;
  const spec = withoutDefaults(
    {
      anchor: optional(tr.a, () => readVector(tr.a, ctx, at(loc, "Anchor Point", ".a"))),
      position: optional(tr.p, () => readPosition(tr.p, ctx, at(loc, "Position", ".p"))),
      scale: optional(tr.s, () => readVector(tr.s, ctx, at(loc, "Scale", ".s"), 0.01)),
      rotation: optional(tr.r ?? tr.rz, () => readScalar(tr.r ?? tr.rz, ctx, at(loc, "Rotation", tr.r ? ".r" : ".rz"))),
      opacity: optional(tr.o, () => readScalar(tr.o, ctx, at(loc, "Opacity", ".o"), 0.01)),
      skew: optional(tr.sk, () => readScalar(tr.sk, ctx, at(loc, "Skew", ".sk"))),
      skewAxis: optional(tr.sa, () => readScalar(tr.sa, ctx, at(loc, "Skew Axis", ".sa"))),
    },
    { anchor: [0, 0], position: [0, 0], scale: [1, 1], rotation: 0, opacity: 1, skew: 0, skewAxis: 0 },
  );
  if (spec.skew === undefined) delete spec.skewAxis;
  return Object.keys(spec).length ? spec : undefined;
}

function strokeProps(item: Item, ctx: ReadContext, loc: Loc): Record<string, unknown> {
  const dashes = Array.isArray(item.d) ? readDashes(item.d, ctx, at(loc, "Dashes", ".d")) : undefined;
  return {
    width: readScalar(item.w, ctx, at(loc, "Stroke Width", ".w")),
    lineCap: LINE_CAP[Number(item.lc ?? 2)] ?? "round",
    lineJoin: LINE_JOIN[Number(item.lj ?? 2)] ?? "round",
    miterLimit:
      Number(item.lj ?? 2) === 1
        ? item.ml2 !== undefined
          ? readStaticNumber(item.ml2, ctx, at(loc, "Miter Limit", ".ml2"), "miter limit")
          : readStaticNumber(item.ml ?? 4, ctx, at(loc, "Miter Limit", ".ml"), "miter limit")
        : undefined,
    dashes,
  };
}

function readDashes(list: unknown[], ctx: ReadContext, loc: Loc): Record<string, unknown> | undefined {
  const pattern: unknown[] = [];
  let offset: unknown;
  list.forEach((entry, index) => {
    const dash = entry as Item;
    if (!dash || typeof dash !== "object") throw invalid(`${loc.path}[${index}]`, "expected a dash entry.");
    const value = readScalar(dash.v, ctx, at(loc, "", `[${index}].v`));
    if (dash.n === "o") offset = value;
    else pattern.push(value);
  });
  if (pattern.length === 0) return undefined;
  return { pattern, ...(offset !== undefined ? { offset } : {}) };
}

function readGradientSpec(item: Item, ctx: ReadContext, loc: Loc): Record<string, unknown> {
  const radial = Number(item.t ?? 1) === 2;
  return {
    kind: radial ? "radial" : "linear",
    start: readVector(item.s, ctx, at(loc, "Start Point", ".s")),
    end: readVector(item.e, ctx, at(loc, "End Point", ".e")),
    highlightLength: radial && item.h !== undefined ? readScalar(item.h, ctx, at(loc, "Highlight Length", ".h"), 0.01) : undefined,
    highlightAngle: radial && item.a !== undefined ? readScalar(item.a, ctx, at(loc, "Highlight Angle", ".a")) : undefined,
    stops: readGradient(item.g, ctx, at(loc, "Colors", ".g")),
    opacity: item.o === undefined ? undefined : readScalar(item.o, ctx, at(loc, "Opacity", ".o"), 0.01),
  };
}

function readItem(item: Item, ctx: ReadContext, loc: Loc, depth: number): unknown | null {
  const hidden = item.hd === true ? { hidden: true } : {};
  switch (item.ty) {
    case "gr":
      return readGroup(item, ctx, loc, depth + 1);
    case "sh":
      return new Call("path", [{ ...hidden, path: readPath(item.ks, ctx, at(loc, "Path", ".ks")) }]);
    case "rc": {
      const d = Number(item.d ?? 0);
      return new Call("rect", [
        withoutDefaults(
          {
            ...hidden,
            position: readVector(item.p, ctx, at(loc, "Position", ".p")),
            size: readVector(item.s, ctx, at(loc, "Size", ".s")),
            roundness: item.r === undefined ? undefined : readScalar(item.r, ctx, at(loc, "Roundness", ".r")),
            // lottie-web draws a rectangle clockwise only for d = 1 or 2.
            direction: d === 1 || d === 2 ? "clockwise" : "counter-clockwise",
          },
          { position: [0, 0], roundness: 0, direction: "clockwise" },
        ),
      ]);
    }
    case "el":
      return new Call("ellipse", [
        withoutDefaults(
          {
            ...hidden,
            position: readVector(item.p, ctx, at(loc, "Position", ".p")),
            size: readVector(item.s, ctx, at(loc, "Size", ".s")),
            direction: Number(item.d ?? 1) === 3 ? "counter-clockwise" : "clockwise",
          },
          { position: [0, 0], direction: "clockwise" },
        ),
      ]);
    case "sr": {
      const polygon = Number(item.sy ?? 1) === 2;
      return new Call(polygon ? "polygon" : "star", [
        withoutDefaults(
          {
            ...hidden,
            position: readVector(item.p, ctx, at(loc, "Position", ".p")),
            points: readScalar(item.pt, ctx, at(loc, "Points", ".pt")),
            outerRadius: readScalar(item.or, ctx, at(loc, "Outer Radius", ".or")),
            innerRadius: polygon || item.ir === undefined ? undefined : readScalar(item.ir, ctx, at(loc, "Inner Radius", ".ir")),
            outerRoundness: item.os === undefined ? undefined : readScalar(item.os, ctx, at(loc, "Outer Roundness", ".os"), 0.01),
            innerRoundness:
              polygon || item.is === undefined ? undefined : readScalar(item.is, ctx, at(loc, "Inner Roundness", ".is"), 0.01),
            rotation: item.r === undefined ? undefined : readScalar(item.r, ctx, at(loc, "Rotation", ".r")),
            direction: Number(item.d ?? 1) === 3 ? "counter-clockwise" : "clockwise",
          },
          { position: [0, 0], rotation: 0, outerRoundness: 0, innerRoundness: 0, direction: "clockwise" },
        ),
      ]);
    }
    case "fl":
      return new Call("fill", [
        withoutDefaults(
          {
            ...hidden,
            color: readColor(item.c, ctx, at(loc, "Color", ".c")),
            opacity: item.o === undefined ? undefined : readScalar(item.o, ctx, at(loc, "Opacity", ".o"), 0.01),
            fillRule: Number(item.r ?? 1) === 2 ? "evenodd" : "nonzero",
          },
          { opacity: 1, fillRule: "nonzero" },
        ),
      ]);
    case "st":
      return new Call("stroke", [
        withoutDefaults(
          {
            ...hidden,
            color: readColor(item.c, ctx, at(loc, "Color", ".c")),
            opacity: item.o === undefined ? undefined : readScalar(item.o, ctx, at(loc, "Opacity", ".o"), 0.01),
            ...strokeProps(item, ctx, loc),
          },
          { opacity: 1, lineCap: "round", lineJoin: "round" },
        ),
      ]);
    case "gf":
      return new Call("gradientFill", [
        withoutDefaults(
          { ...hidden, ...readGradientSpec(item, ctx, loc), fillRule: Number(item.r ?? 1) === 2 ? "evenodd" : "nonzero" },
          { opacity: 1, fillRule: "nonzero" },
        ),
      ]);
    case "gs":
      return new Call("gradientStroke", [
        withoutDefaults(
          { ...hidden, ...readGradientSpec(item, ctx, loc), ...strokeProps(item, ctx, loc) },
          { opacity: 1, lineCap: "round", lineJoin: "round" },
        ),
      ]);
    case "tm":
      return new Call("trim", [
        withoutDefaults(
          {
            ...hidden,
            start: readScalar(item.s, ctx, at(loc, "Start", ".s"), 0.01),
            end: readScalar(item.e, ctx, at(loc, "End", ".e"), 0.01),
            offset: item.o === undefined ? undefined : readScalar(item.o, ctx, at(loc, "Offset", ".o")),
            mode: Number(item.m ?? 1) === 2 ? "individual" : "simultaneous",
          },
          { start: 0, end: 1, offset: 0, mode: "simultaneous" },
        ),
      ]);
    case "rp": {
      const tr = (item.tr ?? {}) as Item;
      const trLoc = at(loc, "Transform", ".tr");
      return new Call("repeater", [
        withoutDefaults(
          {
            ...hidden,
            copies: readScalar(item.c, ctx, at(loc, "Copies", ".c")),
            offset: item.o === undefined ? undefined : readScalar(item.o, ctx, at(loc, "Offset", ".o")),
            composite: Number(item.m ?? 2) === 1 ? "above" : "below",
            transform: withoutDefaults(
              {
                anchor: optional(tr.a, () => readVector(tr.a, ctx, at(trLoc, "Anchor Point", ".a"))),
                position: optional(tr.p, () => readVector(tr.p, ctx, at(trLoc, "Position", ".p"))),
                scale: optional(tr.s, () => readVector(tr.s, ctx, at(trLoc, "Scale", ".s"), 0.01)),
                rotation: optional(tr.r, () => readScalar(tr.r, ctx, at(trLoc, "Rotation", ".r"))),
                startOpacity: optional(tr.so, () => readScalar(tr.so, ctx, at(trLoc, "Start Opacity", ".so"), 0.01)),
                endOpacity: optional(tr.eo, () => readScalar(tr.eo, ctx, at(trLoc, "End Opacity", ".eo"), 0.01)),
              },
              { anchor: [0, 0], position: [0, 0], scale: [1, 1], rotation: 0, startOpacity: 1, endOpacity: 1 },
            ),
          },
          { offset: 0, transform: {} },
        ),
      ]);
    }
    case "op":
      return new Call("offsetPathItem", [
        withoutDefaults(
          {
            ...hidden,
            amount: readScalar(item.a, ctx, at(loc, "Amount", ".a")),
            lineJoin: LINE_JOIN[Number(item.lj ?? 1)] ?? "miter",
            miterLimit: item.ml === undefined ? undefined : readStaticNumber(item.ml, ctx, at(loc, "Miter Limit", ".ml"), "miter limit"),
          },
          { lineJoin: "miter" },
        ),
      ]);
    case "zz":
      return new Call("zigZag", [
        withoutDefaults(
          {
            ...hidden,
            size: readScalar(item.s, ctx, at(loc, "Size", ".s")),
            ridges: readScalar(item.r, ctx, at(loc, "Ridges per segment", ".r")),
            points:
              item.pt !== undefined && readStaticNumber(item.pt, ctx, at(loc, "Points", ".pt"), "zig-zag point type") === 2
                ? "smooth"
                : "corner",
          },
          { points: "corner" },
        ),
      ]);
    case "pb":
      return new Call("puckerBloat", [{ ...hidden, amount: readScalar(item.a, ctx, at(loc, "Amount", ".a"), 0.01) }]);
    case "no":
      report(ctx, "info", "No Style", loc, "a No Style item draws nothing; omitted.");
      return null;
    case "tr":
      report(ctx, "unsupported", "transform outside a group", loc, "a Transform item at the top of a layer's contents is not supported; omitted.");
      return null;
    default: {
      const label = UNSUPPORTED_ITEMS[String(item.ty)] ?? `shape item "${String(item.ty)}"`;
      report(ctx, "unsupported", label, loc, `${label} is not supported yet; omitted.`);
      return null;
    }
  }
}

function itemLabel(item: Item, index: number): string {
  return typeof item.nm === "string" && item.nm ? item.nm : `${String(item.ty)} ${index + 1}`;
}

/** A shape group: its items plus the Transform item Lottie stores last. */
function readGroup(item: Item, ctx: ReadContext, loc: Loc, depth: number): unknown | null {
  if (depth > LIMITS.groupDepth) throw invalid(loc.path, `groups nest deeper than ${LIMITS.groupDepth} levels.`);
  const name = typeof item.nm === "string" ? item.nm : "Group";
  if (item.hd === true) {
    report(ctx, "info", "hidden group", loc, "group is hidden in AE; omitted (lottie-web does not draw it either).");
    return null;
  }
  const list = Array.isArray(item.it) ? (item.it as unknown[]) : [];
  const transformIndex = list.findIndex((it) => (it as Item)?.ty === "tr");
  const transform =
    transformIndex >= 0
      ? readTransform(list[transformIndex] as Item, ctx, at(loc, "Transform", `.it[${transformIndex}]`))
      : undefined;
  const items = readItems(
    list.filter((_, index) => index !== transformIndex),
    ctx,
    loc,
    depth,
    (index) => (index >= transformIndex && transformIndex >= 0 ? index + 1 : index),
    ".it",
  );
  const blend = Number(item.bm ?? 0);
  if (blend !== 0) report(ctx, "unsupported", "blend mode", loc, `group blend mode ${blend} is ignored; normal is used.`);
  return new Call("group", transform ? [name, items, transform] : [name, items]);
}

/** Items of a shape layer or group, in Lottie order (top of AE's list first). */
export function readItems(
  list: unknown[],
  ctx: ReadContext,
  loc: Loc,
  depth = 0,
  sourceIndex: (index: number) => number = (index) => index,
  key = ".shapes",
): unknown[] {
  return list.flatMap((raw, index) => {
    const path = `${key}[${sourceIndex(index)}]`;
    const item = validate(shapeItemSchema, raw, `${loc.path}${path}`) as Item;
    const result = readItem(item, ctx, at(loc, itemLabel(item, index), path), depth);
    return result === null ? [] : [result];
  });
}
