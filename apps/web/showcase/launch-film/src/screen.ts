/**
 * screen.ts — the one place that knows how a captured PNG maps onto the frame.
 *
 * Every overlay in this film (cursor, selection ring, typing mask, the marker
 * under the diff line) is authored against coordinates read off the real
 * screenshots at their native 2880x1744. That only stays honest if a single
 * function converts those pixels into composition pixels, so a change of
 * output size or crop moves the screenshot and its overlays together.
 */

/** Native size of the PNGs written by `e2e/demo-capture.spec.ts`. */
export const SOURCE = { width: 2880, height: 1744 } as const;

export const COMPOSITION = { width: 1920, height: 1080, fps: 30 } as const;

/**
 * The still is laid in with `object-fit: contain`, not `cover`. The capture is
 * 4:2.42 against a 16:9 frame, so covering it would crop 83px off the top and
 * bottom — and the opening shot exists to show the app whole. Fitting instead
 * leaves ~68px of ground down either side, which every beat from 1.08x up
 * covers; only the opening and the closing pull-back ever show it, and there
 * it reads as the window sitting on a desk.
 */
const FIT_SCALE = Math.min(
  COMPOSITION.width / SOURCE.width,
  COMPOSITION.height / SOURCE.height,
);
const FIT_OFFSET_X = (COMPOSITION.width - SOURCE.width * FIT_SCALE) / 2;
const FIT_OFFSET_Y = (COMPOSITION.height - SOURCE.height * FIT_SCALE) / 2;

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; width: number; height: number };

/** A point in captured-screenshot pixels, in composition pixels. */
export const toScreen = (x: number, y: number): Point => ({
  x: x * FIT_SCALE + FIT_OFFSET_X,
  y: y * FIT_SCALE + FIT_OFFSET_Y,
});

/** A rectangle in captured-screenshot pixels, in composition pixels. */
export const toScreenBox = (
  left: number,
  top: number,
  right: number,
  bottom: number,
): Box => {
  const a = toScreen(left, top);
  const b = toScreen(right, bottom);
  return { x: a.x, y: a.y, width: b.x - a.x, height: b.y - a.y };
};

/** `SimulatedCursor` takes percentages of the frame, not pixels. */
export const toCursorPoint = (point: Point) => ({
  x: (point.x / COMPOSITION.width) * 100,
  y: (point.y / COMPOSITION.height) * 100,
});

/**
 * Landmarks, measured off the captures. Names are the app's own words so a
 * re-capture can be checked against them by eye.
 */
export const LANDMARK = {
  /** The composer textarea — where both the brief and the refine are typed. */
  composer: toScreen(1010, 1555),
  /** Primary button under the brief, before a run exists. */
  generate: toScreen(1426, 1670),
  /** Primary button under a refine. */
  send: toScreen(1450, 1670),
  /**
   * Where the arrow tip lands on those two buttons: just inside the left edge,
   * a third of the way down. Aimed at the centre the pointer covers the label
   * of the button it is about to press, which is the one word that has to stay
   * readable in the frame before the press.
   */
  generateEdge: toScreen(1362, 1662),
  sendEdge: toScreen(1408, 1662),
  /** Inspect toggle in the preview pane header. */
  inspect: toScreen(2531, 128),
  /** The stage list while the run is working. */
  stages: toScreen(960, 640),
  /** Middle of the player. */
  player: toScreen(2210, 640),
  /**
   * The player's canvas — the rectangle the generated video actually occupies
   * inside `04`, `05` and `06`. Measured off `04-preview-ready.png` by walking
   * out from the middle until the pane's own ground (#090706) takes over: the
   * canvas is 1312x743 of capture pixels, which is 16:9 to within a pixel.
   * The generated MP4 is composited here, so the film shows the video playing
   * rather than asserting over a frozen player reading 0:00.
   */
  playerCanvas: toScreenBox(1557, 432, 2869, 1175),
  /** The element Inspect resolved to — Beat 0's install-command line. */
  beat: toScreenBox(2069, 1084, 2369, 1117),
  /** The "Changed" card: what moved, in which file, on which lines. */
  changedCard: toScreenBox(518, 860, 1392, 1128),
  /** `src/Composition.tsx:8 +10 -10`, inside that card. */
  diffLine: toScreenBox(575, 976, 1000, 1006),
  /** The single line of refine text, revealed a character at a time. */
  refineText: toScreenBox(528, 1520, 1060, 1590),
  /**
   * The whole first line of the composer. Wider than the refine text, because
   * the placeholder it has to cover runs most of the way across the field.
   */
  composerLine: toScreenBox(520, 1516, 1505, 1594),
} as const;
