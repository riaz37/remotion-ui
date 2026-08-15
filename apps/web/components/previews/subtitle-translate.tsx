"use client";

import { SubtitleTranslate } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const CUES = [
  {
    text: "The transcript is the edit.",
    translation: "La transcripción es el montaje.",
    startMs: 0,
    endMs: 1450,
  },
  {
    text: "Change a word, render again.",
    translation: "Cambia una palabra y vuelve a renderizar.",
    startMs: 1500,
    endMs: 2950,
  },
  {
    text: "Same command, forty seconds.",
    translation: "El mismo comando, cuarenta segundos.",
    startMs: 3000,
    endMs: 4000,
  },
];

/**
 * Samples land at frames 18, 60 and 108 — 600ms, 2000ms and 3600ms — one per
 * cue, each with the second line still trailing the first into place.
 */
export const SubtitleTranslatePreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={0}>
    <SubtitleTranslate
      cues={CUES}
      languageLabels={["EN", "ES"]}
      fontSize={44}
    />
  </PreviewFrame>
);
