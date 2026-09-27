import { loadFont as loadPlex } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

/**
 * theme.ts: one world, one accent.
 *
 * The values are the site's own brand tokens (lib/brand-tokens.ts): stage
 * #050505, ink #ececec, muted #949494, phosphor #e8b86d. The site sets its
 * UI in IBM Plex Sans and its code in JetBrains Mono, so the film does too.
 */
export const COLORS = {
  stage: "#050505",
  ink: "#ececec",
  muted: "#949494",
  faint: "#5a5a5a",
  phosphor: "#e8b86d",
  phosphorRgb: "232, 184, 109",
  plate: "#2a2928",
  hairline: "rgba(236,236,236,0.10)",
} as const;

const plex = loadPlex("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });

export const SANS = plex.fontFamily;
export const MONO = mono.fontFamily;

/** Resolves once both families are usable, so text can be measured. */
export const fontsReady = (): Promise<unknown> => Promise.all([plex.waitUntilDone(), mono.waitUntilDone()]);
