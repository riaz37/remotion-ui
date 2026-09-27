import { ADD_COMMAND } from "../facts";
import {
  BEAT,
  CUT_FRAMES,
  DOCS,
  END,
  FAN,
  HERO,
  REVEAL,
  THESIS,
  terminalTimes,
} from "../timeline";
import { TERMINAL_STEPS } from "../world/Screens";

/**
 * cues.ts: every sound in the film, frame-locked.
 *
 * One list: frame → sound + linear volume, derived from the same timeline
 * constants the picture uses, so moving an event moves its sound. The music
 * is ducked ~6 dB (×0.5) under whooshes, hits and dense clusters of small
 * sounds; `musicGain(frame)` is that envelope. Nothing sounds after
 * END.silence: the film ends on a deliberate second of silence.
 */

export const SOUNDS = {
  whoosh: { file: "whoosh.wav", frames: 30, peak: 15 },
  whooshShort: { file: "whoosh-short.wav", frames: 18, peak: 7 },
  whooshLong: { file: "whoosh-long.wav", frames: 60, peak: 25 },
  click: { file: "click.wav", frames: 3, peak: 0 },
  tick1: { file: "tick-1.wav", frames: 2, peak: 0 },
  tick2: { file: "tick-2.wav", frames: 2, peak: 0 },
  tick3: { file: "tick-3.wav", frames: 2, peak: 0 },
  pop: { file: "pop.wav", frames: 4, peak: 0 },
  popLow: { file: "pop-low.wav", frames: 5, peak: 0 },
  blip: { file: "blip.wav", frames: 14, peak: 0 },
  riser: { file: "riser.wav", frames: 60, peak: 59 },
  impact: { file: "impact.wav", frames: 90, peak: 0 },
  hit: { file: "hit.wav", frames: 21, peak: 0 },
} as const;

export type SoundId = keyof typeof SOUNDS;
export type Cue = { frame: number; sound: SoundId; volume: number };

export const AUDIO_DIR = "remotionui-launch/audio";
export const MUSIC_FILE = "music.mp3";
/** Linear. The score is mastered hot (≈ -10.6 dB mean); this sits it under the effects. */
export const MUSIC_GAIN = 0.42;
const DUCK_DEPTH = 0.5;

const TICKS: SoundId[] = ["tick1", "tick2", "tick3"];
const ticks = (from: number, to: number, every: number, volume: number): Cue[] => {
  const out: Cue[] = [];
  for (let f = from, i = 0; f <= to; f += every, i += 1) {
    out.push({ frame: Math.round(f), sound: TICKS[i % TICKS.length], volume });
  }
  return out;
};

/** A whoosh placed so its loudest moment lands on `peakFrame`. */
const whooshAt = (peakFrame: number, sound: "whoosh" | "whooshShort" | "whooshLong", volume: number): Cue => ({
  frame: peakFrame - SOUNDS[sound].peak,
  sound,
  volume,
});

const term = terminalTimes(ADD_COMMAND, TERMINAL_STEPS.length - 1, 1);

const thesisWords = [...THESIS.line1, ...THESIS.line2].filter((w) => w.at >= 0);

const UNSORTED: Cue[] = [
  // B1: a tick per word; a glyph churn under each decode; a pop as its full stop lands.
  ...thesisWords.filter((w) => !w.decode).map((w, i) => ({ frame: w.at - 3, sound: TICKS[i % 3], volume: 0.3 }) as Cue),
  ...thesisWords
    .filter((w) => w.decode)
    .flatMap((w) => [...ticks(w.at - THESIS.decodeFor, w.at - 2, 2, 0.11), { frame: w.at, sound: "pop" as const, volume: 0.42 }]),

  // B1 → B2 push, the settle, B2 → B3 travel.
  whooshAt(Math.round((THESIS.pushStart + THESIS.pushEnd) / 2) + 4, "whoosh", 0.5),
  whooshAt(HERO.settleStart + 8, "whooshShort", 0.22),
  { frame: HERO.click, sound: "click", volume: 0.6 },
  whooshAt(Math.round((DOCS.travelStart + DOCS.travelEnd) / 2), "whoosh", 0.46),

  // B3: Copy, the push into the terminal, typing, one tick per printed line.
  { frame: DOCS.copyClick, sound: "click", volume: 0.62 },
  { frame: DOCS.copied, sound: "blip", volume: 0.16 },
  whooshAt(DOCS.pushEnd - 6, "whoosh", 0.42),
  ...ticks(term.typeStart, term.typeEnd, 2, 0.14),
  { frame: Math.round(term.submit), sound: "popLow", volume: 0.3 },
  ...term.steps.map((f, i) => ({ frame: Math.round(f), sound: TICKS[i % 3], volume: 0.24 }) as Cue),
  { frame: Math.round(term.summary), sound: "blip", volume: 0.24 },
  whooshAt(Math.round((FAN.travelStart + FAN.travelEnd) / 2), "whoosh", 0.44),
  whooshAt(Math.round((FAN.flipStart + FAN.flipEnd) / 2), "whooshShort", 0.36),
  { frame: FAN.flipEnd, sound: "pop", volume: 0.34 },

  // B4: a pop on every montage cut.
  ...CUT_FRAMES.slice(0, -1).map((f, i) => ({ frame: f, sound: i % 2 ? ("pop" as const) : ("popLow" as const), volume: 0.34 })),

  // B5: the stop, the pull, the count, the line, the gallery, the push.
  { frame: REVEAL.stop, sound: "hit", volume: 0.5 },
  whooshAt(REVEAL.pullStart + 22, "whooshLong", 0.42),
  ...ticks(REVEAL.countStart, REVEAL.countEnd - 3, 3, 0.12),
  { frame: REVEAL.countEnd, sound: "blip", volume: 0.28 },
  ...ticks(REVEAL.lineLand - 10, REVEAL.lineLand - 2, 2, 0.1),
  { frame: REVEAL.lineLand, sound: "pop", volume: 0.4 },
  whooshAt(REVEAL.galleryStart + 12, "whooshShort", 0.26),
  { frame: REVEAL.ringIn, sound: "blip", volume: 0.18 },
  { frame: END.impact - SOUNDS.riser.frames, sound: "riser", volume: 0.4 },

  // B6: the impact, then the command types.
  { frame: END.impact, sound: "impact", volume: 0.5 },
  ...ticks(END.ctaIn, END.ctaIn + 17, 2, 0.12),
];

export const CUES: Cue[] = [...UNSORTED]
  .filter((c) => c.frame + SOUNDS[c.sound].frames <= END.silence || c.sound === "impact")
  .sort((a, b) => a.frame - b.frame);

/* ------------------------------------------------------------------ ducking */

type Window = { from: number; to: number };

const BIG: ReadonlySet<SoundId> = new Set(["whoosh", "whooshShort", "whooshLong", "riser", "impact", "hit"]);
const CLUSTER_SPAN = 20;
const CLUSTER_MIN = 4;

const duckWindows = (cues: Cue[]): Window[] => {
  const big = cues.filter((c) => BIG.has(c.sound)).map((c) => ({ from: c.frame, to: c.frame + Math.min(SOUNDS[c.sound].frames, 36) }));
  const small = cues.filter((c) => !BIG.has(c.sound));
  const clusters = small.flatMap((cue) => {
    const neighbours = small.filter((o) => o.frame >= cue.frame && o.frame < cue.frame + CLUSTER_SPAN);
    return neighbours.length >= CLUSTER_MIN ? [{ from: cue.frame, to: neighbours[neighbours.length - 1].frame + 6 }] : [];
  });
  return [...big, ...clusters];
};

const WINDOWS = duckWindows(CUES);
const ATTACK = 4;
const RELEASE = BEAT;

const activity = (frame: number, w: Window): number => {
  if (frame < w.from - ATTACK || frame > w.to + RELEASE) {
    return 0;
  }
  if (frame < w.from) {
    return (frame - (w.from - ATTACK)) / ATTACK;
  }
  if (frame <= w.to) {
    return 1;
  }
  return 1 - (frame - w.to) / RELEASE;
};

/** Music volume at `frame`: base gain, pulled down 6 dB under effect clusters. */
export const musicGain = (frame: number): number => {
  const duck = WINDOWS.reduce((max, w) => Math.max(max, activity(frame, w)), 0);
  return MUSIC_GAIN * (1 - (1 - DUCK_DEPTH) * duck);
};
