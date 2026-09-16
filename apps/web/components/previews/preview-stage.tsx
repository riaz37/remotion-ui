"use client";

import { createContext, useContext, type ReactNode } from "react";
import { BRAND_STAGE } from "@/lib/brand-tokens";

/**
 * Token set every preview chrome element reads from. Previews paint their own
 * stage, so flipping stage colour without flipping ink and panel fills would
 * leave light-on-light text. Both always travel together.
 */
export type PreviewStageTokens = {
  stage: string;
  ink: string;
  muted: string;
  panelFill: string;
  /**
   * Opaque plate fill, for chips and nodes that sit *over* drawn artwork.
   * `panelFill` is translucent by design, so an annotation chip using it lets
   * the arrow it is labelling show through. Previews were each picking their
   * own near-black for this (#0B0C11, #070810, #06070b …); this is that colour.
   */
  panelSolid: string;
  panelBorder: string;
  /** Highlight ink: must clear 4.5:1 against `stage`, so it differs per stage. */
  accent: string;
};

export const DARK_STAGE: PreviewStageTokens = {
  stage: BRAND_STAGE,
  ink: "#ececec",
  muted: "rgba(236,236,236,0.55)",
  panelFill: "rgba(255,255,255,0.04)",
  panelSolid: "#0b0c11",
  panelBorder: "rgba(255,255,255,0.1)",
  accent: "#e8b86d",
};

export const LIGHT_STAGE: PreviewStageTokens = {
  stage: "#f5f4f2",
  ink: "#111111",
  muted: "rgba(17,17,17,0.58)",
  panelFill: "rgba(17,17,17,0.03)",
  panelSolid: "#ffffff",
  panelBorder: "rgba(17,17,17,0.12)",
  accent: "#b26b00",
};

/**
 * The only corner radii a preview may use.
 *
 * The catalog had grown ten values (999, 99, 28, 24, 22, 20, 12, 10, 8, 6) with
 * no rule behind which one a given panel picked, so neighbouring tiles in the
 * contact sheet rounded differently for no reason. Three steps cover every real
 * case: a pill, the standard panel, and the softer card used by large plates.
 * A preview that genuinely needs another value should say why in a comment.
 */
export const PREVIEW_RADIUS = {
  /** Fully rounded: chips, dots, capsule bars, progress tracks. */
  pill: 999,
  /** Default panel corner — cards, code plates, media tiles, screens. */
  panel: 8,
  /** Large soft plates where the 8px corner reads too sharp at 590px+. */
  card: 24,
} as const;

/**
 * House tracking for preview type.
 *
 * Tight negative tracking is the strongest typographic tell of premium motion
 * work, and the catalog applied it nowhere. Applied at the kit level so every
 * preview that uses the shared type components inherits it.
 */
export const PREVIEW_TRACKING = "-0.02em";

/**
 * Warm/teal glow over a near-black wash, shared by the audio and line-chart
 * previews. Five files carried this literal string with two glow strengths;
 * `strong` matches what audio-pulse and audio-reactive-scale already used.
 */
export const ambientGlowBackground = (
  strength: "soft" | "strong" = "soft",
): string => {
  const [warm, teal] = strength === "strong" ? [0.16, 0.1] : [0.14, 0.09];
  return `radial-gradient(circle at 18% 18%, rgba(232,184,109,${warm}) 0%, transparent 46%), radial-gradient(circle at 82% 64%, rgba(45,212,191,${teal}) 0%, transparent 52%), linear-gradient(to bottom, #050510 0%, #080810 100%)`;
};

const PreviewStageContext = createContext<PreviewStageTokens>(DARK_STAGE);

export const usePreviewStage = (): PreviewStageTokens =>
  useContext(PreviewStageContext);

export const PreviewStageProvider: React.FC<{
  tokens: PreviewStageTokens;
  children: ReactNode;
}> = ({ tokens, children }) => (
  <PreviewStageContext.Provider value={tokens}>
    {children}
  </PreviewStageContext.Provider>
);
