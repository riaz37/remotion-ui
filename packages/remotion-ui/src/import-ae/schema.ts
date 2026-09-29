import { z } from "zod";
import { RemotionUiError } from "../utils/errors.js";

/**
 * Boundary validation for Bodymovin / Lottie JSON. The file is untrusted, so
 * the structure the importer relies on is checked here, with the JSON path of
 * the first problem in the error. Fields the importer never reads stay loose.
 */

/** Hard ceilings, so a hostile file cannot exhaust memory or the stack. */
export const LIMITS = {
  fileBytes: 50 * 1024 * 1024,
  layers: 10_000,
  groupDepth: 64,
  precompDepth: 32,
  keyframes: 200_000,
} as const;

const num = z.number();
const numOrArray = z.union([num, z.array(num)]);

export const easeSchema = z.looseObject({ x: numOrArray, y: numOrArray });

export const keyframeSchema = z.looseObject({
  t: num,
  s: z.unknown().optional(),
  e: z.unknown().optional(),
  h: num.optional(),
  i: easeSchema.optional(),
  o: easeSchema.optional(),
  to: z.array(num).optional(),
  ti: z.array(num).optional(),
});

export const propertySchema = z.looseObject({
  a: num.optional(),
  k: z.unknown(),
  x: z.unknown().optional(),
  s: z.unknown().optional(),
});

export const layerSchema = z.looseObject({
  ty: z.number().int(),
  nm: z.string().optional(),
  ind: num.optional(),
  parent: num.optional(),
  ip: num,
  op: num,
  st: num.optional(),
  sr: num.optional(),
  ks: z.record(z.string(), z.unknown()).optional(),
  shapes: z.array(z.unknown()).optional(),
  refId: z.string().optional(),
  w: num.optional(),
  h: num.optional(),
  sc: z.string().optional(),
  sw: num.optional(),
  sh: num.optional(),
  tm: z.unknown().optional(),
  hd: z.boolean().optional(),
});

export const assetSchema = z.looseObject({
  id: z.union([z.string(), num]).transform(String),
  layers: z.array(z.unknown()).optional(),
  w: num.optional(),
  h: num.optional(),
});

export const animationSchema = z.looseObject({
  v: z.string().optional(),
  nm: z.string().optional(),
  fr: num.positive(),
  ip: num,
  op: num,
  w: num.positive(),
  h: num.positive(),
  layers: z.array(z.unknown()),
  assets: z.array(z.unknown()).optional(),
});

export const shapeItemSchema = z.looseObject({
  ty: z.string(),
  nm: z.string().optional(),
  hd: z.boolean().optional(),
});

export type LottieAnimation = z.infer<typeof animationSchema>;
export type LottieLayer = z.infer<typeof layerSchema>;
export type LottieAsset = z.infer<typeof assetSchema>;
export type LottieProperty = z.infer<typeof propertySchema>;
export type LottieKeyframe = z.infer<typeof keyframeSchema>;
export type LottieEase = z.infer<typeof easeSchema>;
export type LottieShapeItem = z.infer<typeof shapeItemSchema> & Record<string, unknown>;

export function invalid(where: string, message: string): RemotionUiError {
  return new RemotionUiError("LOTTIE_INVALID", `Invalid Lottie JSON at ${where}: ${message}`);
}

/** Parse `value` with `schema`, or throw with the JSON path of the first issue. */
export function validate<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const at = issue.path.reduce<string>(
    (acc, key) => (typeof key === "number" ? `${acc}[${key}]` : `${acc}.${String(key)}`),
    where,
  );
  throw invalid(at, issue.message);
}

/** Read and validate the top level of a Lottie file from its text. */
export function parseLottieText(text: string): LottieAnimation {
  if (Buffer.byteLength(text, "utf8") > LIMITS.fileBytes) {
    throw invalid("$", `file is larger than ${LIMITS.fileBytes / 1024 / 1024} MB.`);
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw invalid("$", `not valid JSON (${error instanceof Error ? error.message : String(error)}).`);
  }
  if (json === null || typeof json !== "object" || Array.isArray(json)) {
    throw invalid("$", "expected a Lottie animation object.");
  }
  const animation = validate(animationSchema, json, "$");
  if (animation.op <= animation.ip) {
    throw invalid("$.op", `out point (${animation.op}) must be after the in point (${animation.ip}).`);
  }
  return animation;
}
