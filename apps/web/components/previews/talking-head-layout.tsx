"use client";

import { Sequence, useVideoConfig } from "remotion";
import { TalkingHeadLayout } from "../../registry/bases/default/scenes/talking-head-layout";
import { DEMO_SPEAKER_SRC } from "@/lib/demo-assets";
import { useDemoAudioSrc } from "@/lib/demo-assets-audio";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * The Sequence premounts a second ahead so the speaker still and the audio the
 * waveform is drawn from are both resolved before the first visible frame.
 *
 * `holdSeconds` follows the measured recipe for the cubic exit easing:
 * 0.9 * 195 / 30 - 0.79 * 0.4 = 5.53, which lands the 90% sample mid-exit
 * instead of on a held frame. See docs-internal/preview-audit-rubric.md.
 */
export const TalkingHeadLayoutPreview: React.FC = () => {
  const { fps } = useVideoConfig();
  const audioSrc = useDemoAudioSrc();
  // Shared in-memory copy; see lib/demo-assets-audio.ts.
  if (!audioSrc) return null;
  return (
    <ScenePreviewPlate direct>
      <Sequence from={0} premountFor={fps}>
        <TalkingHeadLayout
          mediaSrc={DEMO_SPEAKER_SRC}
          audioSrc={audioSrc}
          fit="cover"
          eyebrow="On camera"
          title="Maya Okonkwo"
          subtitle="Founder, Northlight Studio"
          captions={[
            "Keep the speaker readable.",
            "Reserve the lower frame",
            "for captions and platform UI.",
          ]}
          holdSeconds={5.5}
        />
      </Sequence>
    </ScenePreviewPlate>
  );
};
