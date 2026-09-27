/**
 * timeline.ts: every frame event in the film. One source of truth.
 *
 * 120 BPM at 30 fps is exactly 15 frames per beat and 60 per bar. The music in
 * scripts/synth.py is written against the same constants (copied there as
 * numbers, with a comment pointing here).
 *
 *   B1 thesis      0–135     kinetic type, decodes land on beats (f30, f90)
 *   B2 hero        128–255   the live homepage hero, macro push, cursor → CTA
 *   B3 command     242–470   docs page → Copy → terminal → file fan → flip
 *   B4 montage     470–720   Intro payoff, then 17 match cuts in one card
 *   B5 reveal      720–900   hard stop, pull back to the wall, count, gallery
 *   B6 end card    900–1020  logo impact, tagline, CTA, URL, silent tail
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const BEAT = 15;
export const BAR = 60;
export const SIXTEENTH = BEAT / 4;

export const DURATION_IN_FRAMES = 1020;

/* --------------------------------------------------------------- B1 thesis */

export type ThesisWord = { text: string; at: number; decode?: boolean };

export const THESIS = {
  line1: [
    { text: "Motion", at: -30 },
    { text: "design", at: -30 },
    { text: "takes", at: 12 },
    { text: "a", at: 18 },
    { text: "week.", at: 30, decode: true },
  ] as ThesisWord[],
  line1Out: 54,
  line2: [
    { text: "It", at: 64 },
    { text: "should", at: 70 },
    { text: "take", at: 76 },
    { text: "a", at: 82 },
    { text: "command.", at: 90, decode: true },
  ] as ThesisWord[],
  /** Frames a decoding word churns before its landing frame. */
  decodeFor: 16,
  pushStart: 128,
  pushEnd: 160,
} as const;

/* ----------------------------------------------------------------- B2 hero */

export const HERO = {
  /** Plane arrives out of depth over the thesis push. */
  arriveStart: THESIS.pushStart,
  arriveEnd: THESIS.pushEnd,
  /** Macro push across the headline, left to right. */
  macroStart: 160,
  macroEnd: 200,
  /** Settle on the whole hero. */
  settleStart: 200,
  settleEnd: 228,
  cursorIn: 212,
  click: 240,
  /** hero-loop's own frame at HERO.arriveStart (it is mid-loop, not at rest). */
  loopOffset: 150,
} as const;

/* -------------------------------------------------------------- B3 command */

export const DOCS = {
  travelStart: 242,
  travelEnd: 272,
  cursorIn: 255,
  copyClick: 295,
  /** The real "Copied" capture crossfades in over 3 frames. */
  copied: 297,
  pushStart: 300,
  pushEnd: 330,
} as const;

/** The CLI's real output for `npx remotion-ui@latest add intro` (see facts.ts). */
export const TERMINAL = {
  start: 318,
  growEnd: 350,
  speed: 1.25,
  /** `work` seconds per success step handed to terminal-simulator. */
  stepWork: 0.06,
} as const;

/**
 * terminal-simulator's own timeline, replicated from its source (typing at
 * 26 cps from 0.45 s, submit 0.34 s later, steps 0.22 s after that, each
 * step `work` + 0.14 s, info steps 0.14 + 0.14 s, summary 0.18 s after) and
 * mapped to film frames. The sound and the file cards hang off these.
 */
export const terminalTimes = (command: string, successSteps: number, infoSteps: number) => {
  const s = (v: number) => v * FPS;
  const typeStart = s(0.45);
  const typeFrames = (command.length / 26) * FPS;
  const submitAt = typeStart + typeFrames + s(0.34);
  const stepStarts: number[] = [];
  let cursor = submitAt + s(0.22);
  for (let i = 0; i < successSteps; i += 1) {
    stepStarts.push(cursor);
    cursor += s(TERMINAL.stepWork) + s(0.14);
  }
  for (let i = 0; i < infoSteps; i += 1) {
    stepStarts.push(cursor);
    cursor += s(0.14) + s(0.14);
  }
  const summaryAt = cursor + s(0.18);
  const toFilm = (internal: number) => TERMINAL.start + internal / TERMINAL.speed;
  return {
    typeStart: toFilm(typeStart),
    typeEnd: toFilm(typeStart + typeFrames),
    submit: toFilm(submitAt),
    steps: stepStarts.map(toFilm),
    summary: toFilm(summaryAt),
  };
};

export const FAN = {
  /** A file card takes this long to fly from its terminal row to its fan slot. */
  flyFor: 16,
  travelStart: 410,
  travelEnd: 440,
  forwardStart: 438,
  forwardEnd: 452,
  flipStart: 452,
  flipEnd: 470,
} as const;

/* -------------------------------------------------------------- B4 montage */

export const MONTAGE = {
  payoffStart: FAN.flipEnd,
  start: 540,
  /** Cut lengths in 16th notes: 0.63 s down to 0.25 s. Sum 48 = 180 frames. */
  sixteenths: [5, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2],
  end: 720,
} as const;

/** Film frame each montage cut starts on, plus the end. Rounded on the 16th grid. */
export const CUT_FRAMES: number[] = (() => {
  const out: number[] = [];
  let acc = 0;
  MONTAGE.sixteenths.forEach((n) => {
    out.push(Math.round(MONTAGE.start + acc * SIXTEENTH));
    acc += n;
  });
  out.push(Math.round(MONTAGE.start + acc * SIXTEENTH));
  return out;
})();

/* --------------------------------------------------------------- B5 reveal */

export const REVEAL = {
  stop: 720,
  pullStart: 724,
  pullEnd: 790,
  countStart: 732,
  countEnd: 780,
  countOut: 792,
  lineIn: 795,
  lineLand: 810,
  lineOut: 840,
  galleryStart: 835,
  galleryEnd: 868,
  ringIn: 852,
  pushStart: 868,
  pushEnd: 900,
} as const;

/* ------------------------------------------------------------- B6 end card */

export const END = {
  impact: 900,
  taglineIn: 910,
  ctaIn: 920,
  urlIn: 936,
  /** Music and every tail are gone by here; the rest is silence. */
  silence: 990,
} as const;
