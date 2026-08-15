import { AbsoluteFill, useCurrentFrame } from "remotion";

export type KanbanMoveProps = {
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
 * Cards moving across columns. drag-drop-flow is one file into one drop zone.
 *
 * TODO(scaffold): unimplemented. Replace the placeholder body below.
 * Lane: blocks · tags: ui · tier: core
 */
export const KanbanMove: React.FC<KanbanMoveProps> = ({
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
    <AbsoluteFill style={{ display: "grid", placeItems: "center", background: "#0b0b0f" }}>
      <span
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 24,
          color: "#f5f5f7",
          opacity: progress,
        }}
      >
        TODO: kanban-move
      </span>
    </AbsoluteFill>
  );
};
