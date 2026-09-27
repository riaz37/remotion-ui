import { Easing, interpolate } from "remotion";
import { DOCS, FAN, HERO, REVEAL, THESIS, TERMINAL } from "../timeline";
import { DOCS_RECTS, HERO_RECTS, centre } from "../captures";
import { createCamera, type Camera, type Move } from "./rig";

/**
 * shots.ts: where things sit in the world, and the camera's move list.
 *
 * One world unit is one CSS px of a capture at camera scale 1, so s = 2 is
 * 1:1 with the 2× capture pixels, the ceiling for any shot of a capture.
 */

export const PANEL = { w: 1920, h: 1080 } as const;

/** Top-left corners of the capture planes in the world. */
export const WORLD = {
  hero: { x: 0, y: 0 },
  docs: { x: 2600, y: 0 },
} as const;

/** The terminal grows out of the docs page's command line to fill this box. */
export const TERM = {
  centre: { x: WORLD.docs.x + PANEL.w / 2, y: 540 },
  /** Scale of the 1920×1080 terminal stage in world units once grown. */
  scale: 0.7,
} as const;

/** The fan of file cards, and the montage card that becomes a wall tile. */
export const FAN_CENTRE = { x: 6200, y: 540 } as const;
export const CARD = { w: 1440, h: 810, radius: 30 } as const;

/** Wall: every component is one tile; the montage card is tile (WALL.centreCol, WALL.centreRow). */
export const WALL = { cols: 15, rows: 14, gap: 84, centreCol: 7, centreRow: 7 } as const;

const at = (panel: { x: number; y: number }, p: { x: number; y: number }) => ({ x: panel.x + p.x, y: panel.y + p.y });

const heroHeadline = HERO_RECTS.headline;
const docsCode = centre(DOCS_RECTS.code);

const OPENING: Camera = { x: 960, y: 520, s: 0.3 };

export const MOVES: Move[] = [
  // B1 → B2: push out of the type into the hero, landing on the start of the headline.
  {
    kind: "glide",
    start: THESIS.pushStart,
    end: THESIS.pushEnd,
    to: { ...at(WORLD.hero, { x: heroHeadline.x + 110, y: heroHeadline.y + 34 }), s: 1.7 },
    easing: Easing.bezier(0.5, 0, 0.2, 1),
    drift: 0,
    blur: 0.6,
  },
  // Macro push across the headline, left to right. Slow, so it reads.
  {
    kind: "glide",
    start: HERO.macroStart,
    end: HERO.macroEnd,
    to: { ...at(WORLD.hero, { x: heroHeadline.x + heroHeadline.w - 90, y: heroHeadline.y + 44 }), s: 1.85 },
    easing: Easing.bezier(0.37, 0, 0.63, 1),
    drift: 0,
    blur: 0.2,
  },
  // Settle on the whole hero.
  {
    kind: "pull",
    start: HERO.settleStart,
    end: HERO.settleEnd,
    to: { ...at(WORLD.hero, { x: 960, y: 470 }), s: 0.98 },
    drift: 0.00016,
  },
  // Browse components → the intro docs page, framed on Install + the live Player.
  {
    kind: "travel",
    start: DOCS.travelStart,
    end: DOCS.travelEnd,
    to: { ...at(WORLD.docs, { x: 960, y: 480 }), s: 1.25 },
    drift: 0.0002,
  },
  // Copy → push into the command line.
  {
    kind: "glide",
    start: DOCS.pushStart,
    end: DOCS.pushEnd,
    to: { ...at(WORLD.docs, { x: docsCode.x - 180, y: docsCode.y }), s: 1.95 },
    easing: Easing.bezier(0.55, 0, 0.3, 1),
    drift: 0,
    blur: 0.7,
  },
  // Follow the terminal as it grows out of that line.
  {
    kind: "glide",
    start: DOCS.pushEnd - 4,
    end: TERMINAL.growEnd + 4,
    to: { ...TERM.centre, y: TERM.centre.y - 20, s: 1.72 },
    drift: 0.0005,
    blur: 0.5,
  },
  // Out to the fan of files.
  {
    kind: "travel",
    start: FAN.travelStart,
    end: FAN.travelEnd,
    to: { x: FAN_CENTRE.x + 120, y: FAN_CENTRE.y, s: 0.92 },
    drift: 0.0002,
  },
  // The chosen card comes forward and flips: frame it as the montage card.
  {
    kind: "glide",
    start: FAN.travelEnd,
    end: FAN.flipEnd,
    to: { x: FAN_CENTRE.x, y: FAN_CENTRE.y + 20, s: 1.0 },
    drift: 0.00008,
  },
  // Hard stop, then pull back to the wall.
  {
    kind: "cut",
    start: REVEAL.stop,
    end: REVEAL.stop,
    to: { x: FAN_CENTRE.x, y: FAN_CENTRE.y + 20, s: 1.0 * (1 + 0.00008 * (REVEAL.stop - FAN.flipEnd)) },
    drift: 0,
  },
  {
    kind: "pull",
    start: REVEAL.pullStart,
    end: REVEAL.pullEnd,
    to: { x: FAN_CENTRE.x, y: FAN_CENTRE.y + 60, s: 0.23 },
    drift: 0.0004,
  },
];

export const CUTS: number[] = [REVEAL.stop];

const opening = (): Camera => OPENING;

export const cameraAt = createCamera(opening, MOVES);

/** Scales the motion blur per frame (a move's `blur`, default 1). */
export const blurWeight = (frame: number): number => {
  let weight = 1;
  MOVES.forEach((m) => {
    if (frame >= m.start && frame <= m.end + 10) {
      weight = m.blur ?? 1;
    }
  });
  return weight;
};

/** 0 → 1 as the world fades up behind the thesis push. */
export const worldReveal = (frame: number): number =>
  interpolate(frame, [THESIS.pushStart, THESIS.pushStart + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
