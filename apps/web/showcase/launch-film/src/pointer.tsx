import { Sequence } from "remotion";
import { FilmCursor } from "./film-cursor";
import { LANDMARK, toCursorPoint, type Point } from "./screen";

/**
 * pointer — the hand, in two passes.
 *
 * The cursor only exists where the story needs a hand: writing the brief and
 * starting the run, then picking an element and asking for the change. During
 * the run and the preview there is nothing to click, so there is no cursor —
 * a pointer idling over a screenshot is the tell that gives a fake demo away.
 *
 * It lives inside the camera layer, so a zoom scales the cursor with the
 * interface it is pointing at.
 *
 * Two rules the frame numbers below obey, because breaking either one reads as
 * a fake immediately:
 *  - every click is made from a standing hold, never in passing, so the ripple
 *    lands on the control and not on whatever the cursor is flying over;
 *  - the still that shows the result of a click starts *after* that click —
 *    see `SHOTS`, where 05 and 06 come in a few frames past `clickFrames`.
 */

const at = (point: Point) => toCursorPoint(point);

const BEAT_HIT = {
  // A third of the way into the resolved line: the arrow body then lies along
  // the element it picked instead of hanging off the end of it.
  x: LANDMARK.beat.x + LANDMARK.beat.width * 0.3,
  y: LANDMARK.beat.y + LANDMARK.beat.height / 2,
};

const WRITE_THE_BRIEF = {
  from: 0,
  durationInFrames: 144,
  points: [
    { x: 65, y: 28, frame: 0 },
    { ...at(LANDMARK.composer), frame: 40, target: 96 },
    // Held while the brief is on screen, so the last hop to Generate is short
    // and the hand is not parked on the button for a second before it presses.
    { ...at(LANDMARK.composer), frame: 108, target: 96 },
    { ...at(LANDMARK.generateEdge), frame: 126 },
  ],
  clickFrames: [42, 128],
} as const;

const PICK_AND_REFINE = {
  from: 262,
  durationInFrames: 220,
  points: [
    { x: 62, y: 56, frame: 0 },
    { ...at(LANDMARK.inspect), frame: 26, target: 72 },
    // Stationary across the click at 30 — the toggle lights up in `05`, which
    // starts four frames later.
    { ...at(LANDMARK.inspect), frame: 40, target: 72 },
    // No hit ring on the pick: the app draws its own ring around what Inspect
    // resolved, and `SELECTION_PULSE` lands on top of that. A third circle here
    // is the stack the critic caught.
    { ...at(BEAT_HIT), frame: 84 },
    { ...at(BEAT_HIT), frame: 106 },
    { ...at(LANDMARK.composer), frame: 130, target: 96 },
    { ...at(LANDMARK.composer), frame: 186, target: 96 },
    { ...at(LANDMARK.sendEdge), frame: 204 },
  ],
  clickFrames: [30, 92, 208],
} as const;

export const Pointer: React.FC = () => (
  <>
    <Sequence
      layout="none"
      from={WRITE_THE_BRIEF.from}
      durationInFrames={WRITE_THE_BRIEF.durationInFrames}
    >
      <FilmCursor
        points={[...WRITE_THE_BRIEF.points]}
        clickFrames={[...WRITE_THE_BRIEF.clickFrames]}
        durationInFrames={WRITE_THE_BRIEF.durationInFrames}
        size={24}
      />
    </Sequence>

    <Sequence
      layout="none"
      from={PICK_AND_REFINE.from}
      durationInFrames={PICK_AND_REFINE.durationInFrames}
    >
      <FilmCursor
        points={[...PICK_AND_REFINE.points]}
        clickFrames={[...PICK_AND_REFINE.clickFrames]}
        durationInFrames={PICK_AND_REFINE.durationInFrames}
        size={24}
      />
    </Sequence>
  </>
);
