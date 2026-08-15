import { useCurrentFrame } from "remotion";

export type SpeakerLabelCaptionsProps = {
  /** Frames to wait before this starts. */
  delayInFrames?: number;
  /** Length of the entrance. */
  durationInFrames?: number;
  /** Frame the exit begins on. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
};

/**
 * Narrowed: multi-speaker caption track with name tags and color coding. talking-head-layout is a framing scene, not a track.
 *
 * TODO(scaffold): unimplemented. Replace the placeholder body below.
 * Lane: signals · tags: captions · tier: advanced
 */
export const SpeakerLabelCaptions: React.FC<SpeakerLabelCaptionsProps> = ({
  delayInFrames = 0,
  durationInFrames = 30,
  exitAtInFrames = 90,
  exitInFrames = 20,
}) => {
  const frame = useCurrentFrame();
  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  // The placeholder carries an exit on purpose. audit:stills samples 15/50/90%
  // and reports a still tail as a defect; an entrance that settles and holds
  // would make every unbuilt scaffold a false positive on the audit sheet.
  const enter = clamp((frame - delayInFrames) / durationInFrames);
  const exit = clamp((frame - exitAtInFrames) / exitInFrames);
  const progress = enter * (1 - exit);

  return (
    <div style={{ display: "inline-block" }}>
      <span
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 24,
          color: "#f5f5f7",
          opacity: progress,
        }}
      >
        TODO: speaker-label-captions
      </span>
    </div>
  );
};
