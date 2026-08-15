"use client";

import type { Caption } from "@remotion/captions";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { WordPopCaptions } from "../registry-exports";
import { groupCaptionsIntoPages } from "@/remotion/lib/caption-utils";
import { scaleFont } from "@/remotion/lib/layout";
import { PreviewFrame } from "./preview-frame";

const WORDS = ["One", "word", "at", "a", "time", "alone", "on", "frame"];

/** 480ms a word — fast enough to read as a cut rate, slow enough to read. */
const CAPTIONS: Caption[] = WORDS.map((text, index) => ({
  text: ` ${text}`,
  startMs: index * 480,
  endMs: (index + 1) * 480,
  timestampMs: index * 480,
  confidence: 1,
}));

const [page] = groupCaptionsIntoPages(CAPTIONS, WORDS.length * 480 + 100);

/**
 * Samples land at frames 18, 60 and 108 — 600ms, 2000ms and 3600ms into an
 * eight-word run of 480ms each, so each sample catches a different word part
 * way through its pop.
 */
export const WordPopCaptionsPreview: React.FC = () => {
  const { width } = useVideoConfig();

  if (!page) return null;

  return (
    <PreviewFrame lane="signals" padding={0}>
      <AbsoluteFill style={{ justifyContent: "center", padding: 56 }}>
        <WordPopCaptions
          page={page}
          fontSize={scaleFont(150, width)}
          strokeWidth={4}
        />
      </AbsoluteFill>
    </PreviewFrame>
  );
};
