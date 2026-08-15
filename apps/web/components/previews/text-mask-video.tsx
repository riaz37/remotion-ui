"use client";

import { staticFile } from "remotion";
import { TextMaskVideo } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default. The wipe runs frames 2–46 for the first sample, the
 * footage keeps drifting behind the letters for the second, and the wipe
 * unwinds from frame 96 for the third. Not earlier: opacity is gone 70% of the
 * way through an exit, and an exit at 88 left frame 108 completely blank.
 *
 * The source is a real `.mp4` rather than a still: this is the one component
 * whose whole claim is that a *video* plays inside the letterforms, and a
 * gradient preview would never exercise the `OffthreadVideo` path that a render
 * actually takes.
 */
export const TextMaskVideoPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <TextMaskVideo
      text={"IN\nMOTION"}
      src={staticFile("showcases/map-flight.mp4")}
      media="video"
      fontSize={172}
      fontWeight={900}
      letterSpacing={-4}
      reveal="left"
      // The showcase clip is a night basemap. Behind a letterform it reads as
      // grey type unless it is lifted well past where it sits full-frame.
      mediaFilter="brightness(2.6) saturate(1.7) contrast(1.05)"
      delayInFrames={2}
      durationInFrames={44}
      exitAtInFrames={96}
      exitInFrames={26}
    />
  </PreviewFrame>
);
