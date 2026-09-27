import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

/**
 * theme.ts — the palette and type for the whole film.
 *
 * The brand values are Supabase's own dashboard colours; everything else is a
 * derived tint so no stray hex creeps into the panels.
 */

export const COLORS = {
  green: "#3ECF8E",
  greenDeep: "#249361",
  greenTint: "rgba(62, 207, 142, 0.12)",
  greenLine: "rgba(62, 207, 142, 0.35)",
  surface: "#1C1C1C",
  surfaceDeep: "#171717",
  well: "#121212",
  world: "#0C0C0C",
  border: "#2E2E2E",
  borderSoft: "#262626",
  text: "#EDEDED",
  muted: "#A1A1A1",
  faint: "#6E6E6E",
  amber: "#F5C27A",
  sky: "#7CC4FA",
  violet: "#B69CFF",
} as const;

const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
const mono = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export const SANS = inter.fontFamily;
export const MONO = mono.fontFamily;

/** Resolves once both families are usable, so text can be measured. */
export const fontsReady = (): Promise<unknown> =>
  Promise.all([inter.waitUntilDone(), mono.waitUntilDone()]);
