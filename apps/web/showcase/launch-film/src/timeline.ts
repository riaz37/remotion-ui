/**
 * timeline.ts — the cut list.
 *
 * The film is one continuous take over nine stills of a single real run, so the
 * schedule lives in one table rather than inside the components. Every number
 * is a frame at 30fps.
 *
 * The run these stills came from took 3.6 minutes of wall clock. The film cuts
 * that wait rather than compressing it: two title chips say plainly that time
 * passed, and no timer, spinner or progress bar is ever shown running faster
 * than it did.
 */

import { LANDMARK, type Point } from "./screen";

export const DURATION_IN_FRAMES = 750;

/**
 * The still under the camera, when it takes over, and how long it takes.
 *
 * `dissolve` is per shot because the stills do not all differ by the same
 * amount. Two captures that differ in one region can cross-fade; two that
 * change the whole layout cannot — at 50/50 they read as a double exposure,
 * with an empty-state screen printed over a running one. Those cuts are hard
 * (`dissolve: 0`), or they happen behind a `TIME_CUTS` plate where nothing of
 * either still is visible.
 */
export type Shot = { start: number; src: string; dissolve?: number };

/** Fallback for a shot that does not name its own. */
export const DISSOLVE = 8;

export const SHOTS: Shot[] = [
  { start: 0, src: "01-empty-session.png" },
  // Empty state → a written brief: the whole centre column changes. Hard cut.
  { start: 60, src: "02-brief-typed.png", dissolve: 0 },
  // Composer → running stages: another whole-layout change. Hard cut.
  { start: 144, src: "03-running.png", dissolve: 0 },
  // Behind the "a few minutes later" plate, so the length is free.
  { start: 208, src: "04-preview-ready.png", dissolve: 8 },
  // Only the Inspect toggle lights up — and only after the cursor clicks it.
  { start: 296, src: "05-inspect-on.png", dissolve: 5 },
  // Only the picked element gains the app's own ring.
  { start: 358, src: "06-beat-picked.png", dissolve: 6 },
  // The typing overlay has finished writing the line by here, so the full
  // still can take over and light the Send button without a visible jump.
  { start: 458, src: "07-refine-typed.png", dissolve: 8 },
  // Refine sent: the composer clears and the stage list returns. Hard cut.
  { start: 476, src: "08-refining.png", dissolve: 0 },
  // Behind the "under a minute later" plate.
  { start: 525, src: "09-change-landed.png", dissolve: 6 },
];

/** Where the camera is looking, and how close. */
export type CameraKey = { start: number; focal: Point; scale: number };

/**
 * The composer beats sit 20px left of the field's centre. At 1.45x the frame's
 * right edge otherwise lands mid-way through a control in the render pane and
 * leaves a clipped orange sliver hanging off the edge; this reframes it out.
 */
const COMPOSER_FOCAL = { x: LANDMARK.composer.x - 20, y: LANDMARK.composer.y - 50 };

export const CAMERA: CameraKey[] = [
  // The establishing shot is exactly 1: the whole app, uncropped, on its ground.
  { start: 0, focal: { x: 960, y: 540 }, scale: 1 },
  { start: 60, focal: COMPOSER_FOCAL, scale: 1.34 },
  { start: 144, focal: LANDMARK.stages, scale: 1.4 },
  // 1.36, not 1.28, and the same on the next key: at 1.32 or wider the frame
  // reaches the player's transport bar, and the transport in the capture reads
  // `0:00 / 0:10` with an empty scrubber — which is a lie the moment the video
  // starts playing (see PLAYBACK). Framing above it shows the whole canvas and
  // no control that contradicts it. Nothing is drawn over the app's own chrome.
  { start: 208, focal: LANDMARK.player, scale: 1.36 },
  { start: 262, focal: LANDMARK.inspect, scale: 1.36 },
  {
    start: 320,
    focal: { x: LANDMARK.beat.x + LANDMARK.beat.width / 2, y: LANDMARK.beat.y },
    scale: 1.5,
  },
  { start: 388, focal: { ...COMPOSER_FOCAL, y: LANDMARK.composer.y - 40 }, scale: 1.45 },
  { start: 476, focal: { x: 640, y: 600 }, scale: 1.45 },
  {
    start: 525,
    focal: {
      x: LANDMARK.changedCard.x + LANDMARK.changedCard.width / 2,
      y: LANDMARK.changedCard.y + LANDMARK.changedCard.height / 2,
    },
    scale: 1.5,
  },
  // The bookend. It has to settle well before the end card so the whole app
  // reads clean for a beat, not for the two frames it used to get.
  { start: 608, focal: { x: 960, y: 540 }, scale: 1 },
];

/** How long each camera move takes. The rest of a beat is a hold. */
export const CAMERA_MOVE = 26;

/**
 * The refine line, written a character at a time — and the frame the full
 * `07` still takes over, after which the overlay must be gone: the stills that
 * follow show the composer cleared back to its placeholder, which is what
 * really happens once the turn is sent.
 */
export const TYPING = { start: 400, end: 456, handover: 468 } as const;

/**
 * The window where the real generated video plays inside the player.
 *
 * `docs/demo-job/` in cutaway-desktop holds the Remotion project this run
 * wrote; `public/launch-film/demo-after.mp4` is that project rendered. The
 * clip starts at its own frame 0, which is the frame `04-preview-ready.png`
 * already shows paused, so the cut into motion is seamless — the still and
 * the first video frame are the same picture.
 *
 * It ends before `05-inspect-on` arrives, fading back to the still over
 * `fade`, because the pick that follows is authored against the paused frame:
 * the app's own selection ring in `06` sits on the install-command line as it
 * appears at 0:00.
 */
export const PLAYBACK = { start: 216, end: 284, fade: 10 } as const;

/** The Inspect pick, as a ring that expands off the resolved element. */
export const SELECTION_PULSE = 354;

/** Where the marker sweeps under `src/Composition.tsx:8 +10 -10`. */
export const DIFF_MARKER = { start: 570, end: 594 } as const;

/**
 * The end card. The plate reaches full black first, so the display type never
 * has to be read at 50% over live interface; only then does the type arrive.
 */
export const END_CARD = { start: 656, plate: 14, type: 10 } as const;

/** Lower-left captions. Each names the move the frame is making. */
export type Caption = { start: number; end: number; text: string };

export const CAPTIONS: Caption[] = [
  { start: 70, end: 136, text: "Write the brief. Point it at your site." },
  { start: 152, end: 194, text: "Kine visits the pages and writes the code." },
  { start: 230, end: 272, text: "A real video of a real site." },
  { start: 278, end: 308, text: "Arm Inspect." },
  { start: 330, end: 376, text: "Click the thing you want changed." },
  { start: 400, end: 480, text: "Say what to change." },
  // Ends before the plate starts rising, so it never fades out through it.
  { start: 486, end: 512, text: "Only that beat is allowed to move." },
  // Starts after the plate is fully gone, so the payoff line is never printed
  // over the card that carries it.
  { start: 548, end: 616, text: "Changed. Beats 1 and 6 came back byte for byte." },
];

/**
 * The honest cuts. A generate takes minutes and a refine takes tens of
 * seconds; these chips stand in for that wait instead of a sped-up spinner.
 *
 * Each plate is fully opaque for its middle third — see `FADE` in captions —
 * and the still under it changes inside that window, so the audience sees one
 * screen, a black card that names the wait, and then a different screen.
 */
export const TIME_CUTS: Caption[] = [
  { start: 196, end: 228, text: "a few minutes later" },
  { start: 514, end: 544, text: "under a minute later" },
];
