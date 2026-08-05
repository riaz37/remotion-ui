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
  panelBorder: string;
  /** Highlight ink — must clear 4.5:1 against `stage`, so it differs per stage. */
  accent: string;
};

export const DARK_STAGE: PreviewStageTokens = {
  stage: BRAND_STAGE,
  ink: "#ececec",
  muted: "rgba(236,236,236,0.55)",
  panelFill: "rgba(255,255,255,0.04)",
  panelBorder: "rgba(255,255,255,0.1)",
  accent: "#e8b86d",
};

export const LIGHT_STAGE: PreviewStageTokens = {
  stage: "#f5f4f2",
  ink: "#111111",
  muted: "rgba(17,17,17,0.58)",
  panelFill: "rgba(17,17,17,0.03)",
  panelBorder: "rgba(17,17,17,0.12)",
  accent: "#b26b00",
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
