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
    .prefault({}),
  aliases: z
    .object({
      primitives: z.string().default("@/remotion/primitives"),
      scenes: z.string().default("@/remotion/scenes"),
      compositions: z.string().default("@/compositions"),
      lib: z.string().default("@/remotion/lib"),
      hooks: z.string().default("@/remotion/hooks"),
    })
    .prefault({}),
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

// Atlas values are display and filter metadata only. They stay open strings so
// a registry that adds a lane, drive or tier does not break CLIs already
// installed: an enum here made 0.9.1 and 0.10.0 reject the whole index as soon
// as the registry gained the "motion", "shaders" and "3d" lanes.
export const atlasMetaSchema = z.object({
  lane: z.string(),
  drive: z.string(),
  tier: z.string(),
  tags: z.array(z.string()).optional(),
});

export const compatMetaSchema = z.object({
  remotion: z.string().optional(),
});

export const registryItemSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  atlas: atlasMetaSchema.optional(),
  composition: compositionMetaSchema.optional(),
  compat: compatMetaSchema.optional(),
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
