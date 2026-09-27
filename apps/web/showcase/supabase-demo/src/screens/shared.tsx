import { interpolate } from "remotion";
import { ROW_INSERT } from "../timeline";
import { CLAMP } from "../lib/anim";
import type { CaptureId, RowInsert } from "../captures";
import type { Rect } from "../world/layout";
import {
  RowFlash,
  RowInsertLayer,
  States,
  flashAt,
  insertProgress,
  type State,
} from "../world/capture-layers";

/**
 * shared.tsx — the one pattern four screens use: some captured states, then a
 * row lands, then more captured states on top of the "after" screen.
 */

type Props = {
  frame: number;
  /** States up to the insert. The last one must be the "before" capture. */
  before: readonly State[];
  beforeId: CaptureId;
  afterId: CaptureId;
  row: RowInsert;
  insertAt: number;
  /** States after the row has landed, starting from `afterId`. */
  after?: readonly State[];
  /** The new row's visible cells, for the landing wash. */
  flashRect: Rect;
};

export const InsertScreen: React.FC<Props> = ({
  frame,
  before,
  beforeId,
  afterId,
  row,
  insertAt,
  after = [],
  flashRect,
}) => {
  const landed = insertAt + ROW_INSERT;
  const flash = flashAt(frame, insertAt, landed);
  if (frame < insertAt) {
    return <States frame={frame} states={before} />;
  }
  if (frame < landed) {
    return (
      <RowInsertLayer
        before={beforeId}
        after={afterId}
        row={row}
        p={insertProgress(frame, insertAt, ROW_INSERT)}
        flash={flash}
        flashRect={flashRect}
      />
    );
  }
  return (
    <>
      <States frame={frame} states={[{ id: afterId, at: landed }, ...after]} />
      <RowFlash rect={flashRect} strength={flash} />
    </>
  );
};

/** A ring that fades in at `from`, holds, and fades out at `to`. */
export const pulse = (frame: number, from: number, to: number, fade = 6): number =>
  interpolate(frame, [from, from + fade, to - fade, to], [0, 1, 1, 0], CLAMP);
