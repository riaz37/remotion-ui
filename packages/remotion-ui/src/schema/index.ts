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

export const registryItemSchema = z.object({
  name: z.string(),
  type: z.string(),
  dependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
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
