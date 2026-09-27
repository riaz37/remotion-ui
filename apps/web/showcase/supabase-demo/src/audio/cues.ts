import { AUTH, BEAT, CUT_FRAME, DB, EDGE, END, HOOK, PULLBACK, REALTIME, ROW_INSERT, STORAGE, VECTOR } from "../timeline";
import { MOVES } from "../camera/shots";
import { CURSOR_CLICKS } from "../overlay/Cursor";
import { SQL_PLAN, VECTOR_PLAN } from "../screens/database";
import { typingEnd } from "../world/capture-layers";

/**
 * cues.ts — every sound in the film, frame-locked.
 *
 * One list: frame → sound + linear volume. Cues are derived from the same
 * timeline constants the picture uses, so moving an event moves its sound.
 * The music is ducked ~6 dB (×0.5) under whooshes, hits and dense clusters of
 * small sounds; `musicGain(frame)` is that envelope.
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

export const AUDIO_DIR = "supabase-demo/audio";
export const MUSIC_FILE = "music.mp3";
/** Linear. The score is mastered hot (≈ -9 dB mean), this sits it under the effects. */
export const MUSIC_GAIN = 0.4;
const DUCK_DEPTH = 0.5; // −6 dB

const TICKS: SoundId[] = ["tick1", "tick2", "tick3"];
const ticks = (from: number, to: number, every: number, volume = 0.2): Cue[] => {
  const out: Cue[] = [];
  for (let f = from, i = 0; f <= to; f += every, i += 1) {
    out.push({ frame: Math.round(f), sound: TICKS[i % TICKS.length], volume });
  }
  return out;
};

/** Whooshes are placed so their loudest moment lands on the move's peak speed. */
const whooshes: Cue[] = MOVES.filter((m) => m.kind !== "cut").map((m) => {
  const mid = Math.round((m.start + m.end) / 2);
  if (m.kind === "travel") {
    return { frame: mid - SOUNDS.whoosh.peak, sound: "whoosh", volume: 0.5 };
  }
  if (m.kind === "pull") {
    return { frame: m.start + 14 - SOUNDS.whooshLong.peak, sound: "whooshLong", volume: 0.55 };
  }
  // Glides: the push to the end card accelerates to the last frame.
  const loud = m.start === PULLBACK.pushStart ? m.end - 4 : m.start + 6;
  const volume = m.start === PULLBACK.pushStart ? 0.45 : m.end - m.start < 20 ? 0.32 : 0.24;
  return { frame: loud - SOUNDS.whooshShort.peak, sound: "whooshShort", volume };
});

/** A row lands: the pop sits where the slide settles, not where it starts. */
const land = (at: number, volume = 0.34): Cue => ({ frame: at + Math.round(ROW_INSERT / 2), sound: "pop", volume });

const UNSORTED: Cue[] = [
  // S1 hook — one tick per word.
  ...HOOK.wordFrames.map((f, i) => ({ frame: f, sound: TICKS[i % 3], volume: 0.3 }) as Cue),

  ...whooshes,

  // Every cursor press.
  ...CURSOR_CLICKS.map((f) => ({ frame: f, sound: "click" as const, volume: 0.6 })),

  // S2 database — the row lands; the query types; the results answer.
  land(DB.rowInsert, 0.38),
  ...ticks(DB.sqlTypeStart, typingEnd(SQL_PLAN) - 1, 3, 0.15),
  { frame: DB.resultsIn, sound: "blip", volume: 0.24 },

  // S3 auth — the dialog closes and the user row lands.
  { frame: AUTH.dialogOut, sound: "popLow", volume: 0.2 },
  land(AUTH.rowInsert, 0.4),

  // S4 realtime — the broadcast goes out, the message arrives, its payload opens.
  { frame: REALTIME.dialogOut, sound: "popLow", volume: 0.2 },
  land(REALTIME.arrive, 0.4),
  { frame: REALTIME.detailIn, sound: "blip", volume: 0.2 },

  // S5 storage — two files land.
  land(STORAGE.rowInsert, 0.36),
  { frame: STORAGE.rowInsert + Math.round(ROW_INSERT / 2) + 4, sound: "popLow", volume: 0.34 },
  { frame: STORAGE.previewIn, sound: "blip", volume: 0.16 },

  // The cut, then edge: the Test sheet slides in and the 200 comes back.
  { frame: CUT_FRAME, sound: "hit", volume: 0.62 },
  { frame: EDGE.panelIn, sound: "whooshShort", volume: 0.22 },
  { frame: EDGE.responseIn, sound: "blip", volume: 0.3 },

  // S6 vector — the column lights, the query types, the nearest rows answer.
  { frame: VECTOR.columnFocus, sound: "popLow", volume: 0.3 },
  ...ticks(VECTOR.typeStart, typingEnd(VECTOR_PLAN) - 1, 3, 0.15),
  { frame: VECTOR.resultsIn, sound: "blip", volume: 0.24 },
  { frame: VECTOR.topRow, sound: "pop", volume: 0.34 },

  // S7 into the pull-back.
  { frame: PULLBACK.start - SOUNDS.riser.frames, sound: "riser", volume: 0.42 },

  // S8 the logo.
  { frame: END.logoIn, sound: "impact", volume: 0.72 },
];

export const CUES: Cue[] = [...UNSORTED].sort((a, b) => a.frame - b.frame);

/* ------------------------------------------------------------------ ducking */

type Window = { from: number; to: number };

const BIG: ReadonlySet<SoundId> = new Set(["whoosh", "whooshShort", "whooshLong", "riser", "impact", "hit"]);
const CLUSTER_SPAN = 20;
const CLUSTER_MIN = 3;

const duckWindows = (cues: Cue[]): Window[] => {
  const windows: Window[] = cues
    .filter((c) => BIG.has(c.sound))
    .map((c) => ({ from: c.frame, to: c.frame + Math.min(SOUNDS[c.sound].frames, 36) }));

  const small = cues.filter((c) => !BIG.has(c.sound));
  small.forEach((cue, i) => {
    const neighbours = small.filter((o) => o.frame >= cue.frame && o.frame < cue.frame + CLUSTER_SPAN);
    if (neighbours.length >= CLUSTER_MIN) {
      windows.push({ from: cue.frame, to: neighbours[neighbours.length - 1].frame + 6 });
    }
    return i;
  });
  return windows;
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
