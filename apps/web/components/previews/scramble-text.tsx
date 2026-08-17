"use client";

import { ScrambleText } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default. `order="center"` halves the effective stagger depth:
 * "Resolve out of noise" is 17 units once the spaces drop out of the split, so
 * the outermost character ranks 8, not 16.
 *
 * The timing is chosen so each sample lands on a different, *readable* pose:
 *
 * - frame 18 — ranks 0-2 have landed (3r + 12) and the rest are still churning,
 *   so the still shows type resolving out of noise rather than a row of symbols.
 * - frame 60 — every rank has landed by 36, so the headline is clean.
 * - frame 108 — the exit re-scrambles from 102 outwards, so the centre is
 *   churning again while the ends are still solid. The exit stagger is the lever
 *   here, not the start frame: at 1 frame per rank the whole line went to noise
 *   within nine frames and the still was unreadable garbage, so it is 3, which
 *   puts five of the seventeen characters back in noise at the sample. Starting
 *   much later would let exit opacity, which is gone 70% of the way through,
 *   empty the frame before the sample lands.
 *
 * `scrambleOpacity` sits well under the resolved type on purpose — the noise has
 * to read as noise, not as the headline.
 */
const stage = {
  display: "grid",
  placeItems: "center",
  width: "100%",
  textAlign: "center" as const,
};

export const ScrambleTextPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={stage}>
      <ScrambleText
        text="Resolve out of noise"
        order="center"
        charset="symbols"
        tickInFrames={2}
        delayInFrames={0}
        staggerInFrames={3}
        durationInFrames={12}
        exitAtInFrames={102}
        exitInFrames={20}
        exitStaggerInFrames={3}
        scrambleColor="#e8b86d"
        scrambleOpacity={0.55}
        fontSize={62}
      />
    </div>
  </PreviewFrame>
);
