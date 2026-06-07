import {
  useWindowedAudioData,
  visualizeAudio,
} from "@remotion/media-utils";
import { useCurrentFrame, useVideoConfig } from "remotion";

export type UseSpectrumBarsOptions = {
  src: string;
  numberOfSamples?: number;
  windowInSeconds?: number;
};

export function useSpectrumBars({
  src,
  numberOfSamples = 64,
  windowInSeconds = 30,
}: UseSpectrumBarsOptions) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({
    src,
    frame,
    fps,
    windowInSeconds,
  });

  if (!audioData) {
    return { frequencies: null as number[] | null, audioData: null };
  }

  const frequencies = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples,
    optimizeFor: "speed",
    dataOffsetInSeconds,
  });

  return { frequencies, audioData };
}

/** Logarithmic scaling for more balanced bar heights */
export function scaleFrequenciesForDisplay(
  frequencies: number[],
  minDb = -100,
  maxDb = -30,
) {
  return frequencies.map((value) => {
    if (value <= 0) return 0;
    const db = 20 * Math.log10(value);
    return Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)));
  });
}
