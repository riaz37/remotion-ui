import { z } from "zod";

export const remotionUiConfigSchema = z.object({
  $schema: z.string().optional(),
  preset: z.string().default("default"),
  tsx: z.boolean().default(true),
  remotion: z
    .object({
      version: z.string().default("4"),
      config: z.string().default("remotion.config.ts"),
      root: z.string().default("src/Root.tsx"),
    })
    .default({}),
  aliases: z
    .object({
      primitives: z.string().default("@/remotion/primitives"),
      scenes: z.string().default("@/remotion/scenes"),
      compositions: z.string().default("@/compositions"),
      lib: z.string().default("@/remotion/lib"),
      hooks: z.string().default("@/remotion/hooks"),
    })
    .default({}),
});

export type RemotionUiConfig = z.infer<typeof remotionUiConfigSchema>;

export const compositionMetaSchema = z.object({
  id: z.string(),
  component: z.string(),
  durationInFrames: z.number(),
  fps: z.number(),
  width: z.number(),
  height: z.number(),
  importPath: z.string().optional(),
});

export const atlasMetaSchema = z.object({
  lane: z.enum([
    "atoms",
    "signals",
    "vectors",
    "spatial",
    "blocks",
    "cuts",
    "reels",
  ]),
  drive: z.enum(["time", "data", "media", "spatial"]),
  tier: z.enum(["core", "advanced"]),
  tags: z.array(z.string()).optional(),
});

export const registryItemSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  atlas: atlasMetaSchema.optional(),
  composition: compositionMetaSchema.optional(),
  files: z.array(
    z.object({
      path: z.string(),
      type: z.string(),
      target: z.string().optional(),
      content: z.string().optional(),
    }),
  ),
});

export type RegistryItem = z.infer<typeof registryItemSchema>;

export const registrySchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  homepage: z.string().optional(),
  items: z.array(registryItemSchema),
});

export type Registry = z.infer<typeof registrySchema>;

export const registryIndexItemSchema = registryItemSchema
  .pick({
    name: true,
    type: true,
    description: true,
    atlas: true,
  })
  .strict();

export const registryIndexSchema = z
  .object({
    name: z.string(),
    homepage: z.string().optional(),
    items: z.array(registryIndexItemSchema),
  })
  .strict();

export type RegistryIndex = z.infer<typeof registryIndexSchema>;
