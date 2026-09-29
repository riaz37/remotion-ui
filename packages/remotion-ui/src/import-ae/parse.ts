import {
  at,
  isKeyframed,
  readScalar,
  report,
  type ImportIssue,
  type Loc,
  type ReadContext,
} from "./properties.js";
import { readItems, readTransform } from "./shapes.js";
import {
  assetSchema,
  invalid,
  layerSchema,
  LIMITS,
  parseLottieText,
  validate,
  type LottieAnimation,
  type LottieAsset,
  type LottieLayer,
} from "./schema.js";

/**
 * Lottie → an importable model: compositions of layers whose specs are
 * printer nodes for `ae-import` constructors, plus the report of everything
 * that could not be carried over.
 */

export type LayerKind = "shape" | "solid" | "null" | "precomp";

export type ParsedLayer = {
  /** Lottie `ind`, what `parent` refers to. */
  index: number;
  name: string;
  kind: LayerKind;
  /** Arguments for the `<kind>Layer({...})` constructor, minus `parent`. */
  spec: Record<string, unknown>;
  /** Lottie `ind` of the parent layer, if any. */
  parent?: number;
  /** Precomp layers: the asset they show. */
  precomp?: string;
  /** Drawn? Nulls and matte sources are data only. */
  visible: boolean;
  /** Why a layer became a null / hidden, for a comment in the output. */
  note?: string;
};

export type ParsedComp = {
  /** `main` or the precomp asset id. */
  id: string;
  name: string;
  width: number;
  height: number;
  /** Lottie order: index 0 is the top of the AE timeline. */
  layers: ParsedLayer[];
};

export type ParsedAnimation = {
  name: string;
  version?: string;
  width: number;
  height: number;
  fps: number;
  inPoint: number;
  outPoint: number;
  durationInFrames: number;
  main: ParsedComp;
  /** Referenced precomps, each once, dependencies first. */
  precomps: ParsedComp[];
  issues: ImportIssue[];
};

const LAYER_TYPE_NAMES: Record<number, string> = {
  0: "precomp",
  1: "solid",
  2: "image",
  3: "null",
  4: "shape",
  5: "text",
  6: "audio",
  7: "video placeholder",
  8: "image sequence",
  9: "video",
  10: "image placeholder",
  11: "guide",
  12: "adjustment",
  13: "camera",
  14: "light",
  15: "data",
};

/** Effects AE uses to drive expressions; they draw nothing on their own. */
const CONTROL_EFFECT_TYPES = new Set([0, 1, 2, 3, 4, 5, 6, 7, 10]);

function checkLayerFeatures(layer: LottieLayer & Record<string, unknown>, ctx: ReadContext, loc: Loc): { matteSource: boolean } {
  if (layer.ddd === 1) report(ctx, "unsupported", "3D layer", loc, "3D layers are drawn flat; z position, orientation and x/y rotation are ignored.");
  if (layer.ao === 1) report(ctx, "unsupported", "auto-orient", loc, "Auto-Orient along path is ignored; the layer keeps its own rotation.");
  if (Number(layer.bm ?? 0) !== 0) report(ctx, "unsupported", "blend mode", loc, `blend mode ${String(layer.bm)} is ignored; normal is used.`);
  const masks = Array.isArray(layer.masksProperties) ? (layer.masksProperties as Record<string, unknown>[]) : [];
  const activeMasks = masks.filter((m) => m?.mode !== "n");
  if (activeMasks.length > 0) {
    report(ctx, "unsupported", "mask", loc, `${activeMasks.length} mask(s) ignored; the layer draws unmasked.`);
  } else if (masks.length > 0) {
    report(ctx, "info", "mask (mode None)", loc, "masks set to None have no effect; omitted.");
  }
  if (layer.tt !== undefined && Number(layer.tt) !== 0) {
    report(ctx, "unsupported", "track matte", loc, "track matte ignored; the layer draws unmatted.");
  }
  const matteSource = layer.td !== undefined && Number(layer.td) !== 0;
  if (matteSource) {
    report(ctx, "unsupported", "track matte source", loc, "matte source layer kept but hidden, as it would be when used as a matte.");
  }
  const effects = Array.isArray(layer.ef) ? (layer.ef as Record<string, unknown>[]) : [];
  const visual = effects.filter((e) => !CONTROL_EFFECT_TYPES.has(Number(e?.ty)));
  if (visual.length > 0) {
    const names = visual.map((e) => (typeof e?.nm === "string" ? e.nm : `type ${String(e?.ty)}`)).join(", ");
    report(ctx, "unsupported", "layer effect", loc, `effects ignored: ${names}.`);
  } else if (effects.length > 0) {
    report(ctx, "info", "expression controls", loc, "expression control effects draw nothing; omitted.");
  }
  return { matteSource };
}

/**
 * In/out points, plus a precomp's clock. Lottie keyframe times are already
 * composition time — Bodymovin bakes the start time and stretch of ordinary
 * layers into them, and lottie-web ignores `st`/`sr` there — so only a
 * precomp keeps them, to offset and stretch its inner time.
 */
function timing(layer: LottieLayer, ctx: ReadContext, loc: Loc, isPrecomp: boolean): Record<string, unknown> {
  const spec: Record<string, unknown> = { inPoint: layer.ip, outPoint: layer.op };
  const stretch = layer.sr ?? 1;
  if (isPrecomp) {
    if (layer.st) spec.startTime = layer.st;
    if (stretch !== 1) spec.timeStretch = stretch;
  } else if (stretch !== 1) {
    report(ctx, "info", "time stretch", loc, `stretch ${stretch} is already baked into this layer's keyframes.`);
  }
  return spec;
}

function readLayer(
  raw: unknown,
  position: number,
  ctx: ReadContext,
  compLoc: Loc,
  assets: Map<string, LottieAsset>,
  visitPrecomp: (id: string, loc: Loc) => void,
): ParsedLayer {
  const path = `${compLoc.path}.layers[${position}]`;
  const layer = validate(layerSchema, raw, path) as LottieLayer & Record<string, unknown>;
  const typeName = LAYER_TYPE_NAMES[layer.ty] ?? `type ${layer.ty}`;
  const name = layer.nm && layer.nm.trim() ? layer.nm : `${typeName} ${position + 1}`;
  const loc: Loc = { where: `${compLoc.where}layer "${name}"`, path };
  const { matteSource } = checkLayerFeatures(layer, ctx, loc);

  const index = layer.ind ?? position + 1;
  const base: Record<string, unknown> = {
    name,
    ...timing(layer, ctx, loc, layer.ty === 0),
    transform: readTransform(layer.ks as Record<string, unknown> | undefined, ctx, at(loc, "Transform", ".ks")),
  };
  if (layer.hd === true) base.hidden = true;
  if (matteSource) base.hidden = true;
  const parent = layer.parent;

  const result = (kind: LayerKind, extra: Record<string, unknown> = {}, note?: string, precomp?: string): ParsedLayer => ({
    index,
    name,
    kind,
    spec: { ...base, ...extra },
    parent,
    precomp,
    visible: kind !== "null" && base.hidden !== true,
    note,
  });

  switch (layer.ty) {
    case 4: {
      const shapes = layer.shapes ?? [];
      return result("shape", { contents: readItems(shapes, ctx, loc) });
    }
    case 1: {
      if (typeof layer.sc !== "string" || !/^#[0-9a-fA-F]{3,8}$/.test(layer.sc)) {
        throw invalid(`${path}.sc`, "solid colour must be a #rrggbb string.");
      }
      return result("solid", { color: layer.sc.slice(0, 7), width: layer.sw ?? 0, height: layer.sh ?? 0 });
    }
    case 3:
      return result("null");
    case 0: {
      const refId = layer.refId;
      if (!refId || !assets.has(refId) || !assets.get(refId)?.layers) {
        report(ctx, "unsupported", "missing precomp", loc, `precomp asset "${String(refId)}" not found; kept as a null.`);
        return result("null", {}, "precomp asset missing");
      }
      visitPrecomp(refId, loc);
      const extra: Record<string, unknown> = { width: layer.w ?? 0, height: layer.h ?? 0 };
      if (layer.tm !== undefined) {
        const tm = layer.tm as Record<string, unknown>;
        // Time remap is stored in seconds; the runtime wants precomp frames.
        extra.timeRemap = readScalar(tm, ctx, at(loc, "Time Remap", ".tm"), ctx.fps);
        if (!isKeyframed(tm.k)) report(ctx, "info", "static time remap", loc, "time remap is constant: the precomp shows a single frame.");
      }
      return result("precomp", extra, undefined, refId);
    }
    default: {
      report(
        ctx,
        "unsupported",
        `${typeName} layer`,
        loc,
        `${typeName} layers are not supported; kept as a null so parented layers still follow it.`,
      );
      return result("null", {}, `${typeName} layer — content not imported`);
    }
  }
}

function checkParents(comp: ParsedComp, ctx: ReadContext, loc: Loc): void {
  const byIndex = new Map(comp.layers.map((l) => [l.index, l]));
  if (byIndex.size !== comp.layers.length) {
    throw invalid(loc.path, "two layers share the same `ind`.");
  }
  for (const layer of comp.layers) {
    if (layer.parent === undefined) continue;
    if (!byIndex.has(layer.parent)) {
      report(ctx, "unsupported", "missing parent", { ...loc, where: `${loc.where}layer "${layer.name}"` }, `parent ${layer.parent} does not exist; unparented.`);
      layer.parent = undefined;
      continue;
    }
    const seen = new Set<number>([layer.index]);
    for (let p = byIndex.get(layer.parent); p; p = p.parent === undefined ? undefined : byIndex.get(p.parent)) {
      if (seen.has(p.index)) throw invalid(loc.path, `parenting cycle through layer "${layer.name}".`);
      seen.add(p.index);
    }
  }
}

/** Parse a Lottie file's text into the importable model. */
export function parseLottie(text: string): ParsedAnimation {
  return parseAnimation(parseLottieText(text));
}

export function parseAnimation(animation: LottieAnimation): ParsedAnimation {
  const ctx: ReadContext = { fps: animation.fr, issues: [], keyframeCount: { value: 0 } };
  const assets = new Map<string, LottieAsset>();
  (animation.assets ?? []).forEach((raw, index) => {
    const asset = validate(assetSchema, raw, `$.assets[${index}]`);
    assets.set(asset.id, asset);
  });

  let layerCount = 0;
  const done = new Map<string, ParsedComp>();
  const order: ParsedComp[] = [];

  const readComp = (id: string, name: string, width: number, height: number, layers: unknown[], loc: Loc, stack: string[]): ParsedComp => {
    layerCount += layers.length;
    if (layerCount > LIMITS.layers) throw invalid(loc.path, `more than ${LIMITS.layers} layers in the file.`);
    const visitPrecomp = (refId: string, from: Loc) => {
      if (stack.includes(refId)) throw invalid(from.path, `precomp "${refId}" contains itself.`);
      if (stack.length >= LIMITS.precompDepth) throw invalid(from.path, `precomps nest deeper than ${LIMITS.precompDepth}.`);
      if (done.has(refId)) return;
      const asset = assets.get(refId)!;
      const assetIndex = [...assets.keys()].indexOf(refId);
      const comp = readComp(
        refId,
        typeof asset.nm === "string" && asset.nm ? asset.nm : refId,
        asset.w ?? animation.w,
        asset.h ?? animation.h,
        asset.layers ?? [],
        { where: `precomp "${refId}" › `, path: `$.assets[${assetIndex}]` },
        [...stack, refId],
      );
      done.set(refId, comp);
      order.push(comp);
    };
    const parsed = layers.map((raw, position) => readLayer(raw, position, ctx, loc, assets, visitPrecomp));
    const comp: ParsedComp = { id, name, width, height, layers: parsed };
    checkParents(comp, ctx, loc);
    return comp;
  };

  const main = readComp("main", animation.nm ?? "Animation", animation.w, animation.h, animation.layers, { where: "", path: "$" }, []);
  const unused = [...assets.values()].filter((a) => !a.layers && !done.has(a.id));
  if (unused.length > 0 && !ctx.issues.some((i) => i.feature === "image layer")) {
    report(ctx, "info", "unused assets", { where: "assets", path: "$.assets" }, `${unused.length} image/footage asset(s) not referenced by any imported layer.`);
  }

  return {
    name: animation.nm ?? "Animation",
    version: animation.v,
    width: animation.w,
    height: animation.h,
    fps: animation.fr,
    inPoint: animation.ip,
    outPoint: animation.op,
    // lottie-web plays floor(op - ip) frames; @remotion/lottie follows it.
    durationInFrames: Math.max(1, Math.floor(animation.op - animation.ip)),
    main,
    precomps: order,
    issues: ctx.issues,
  };
}
