/**
 * timeline.ts — the single source of truth for time.
 *
 * The composition length, every beat, every camera move, every UI event and
 * every sound cue is expressed here in frames. The score (scripts/synth.py) is
 * written against the same numbers: 120 BPM at 30 fps is exactly 15 frames per
 * beat, so camera moves start and peak on the grid.
 *
 * v2: every surface is a real capture of the Supabase dashboard (acme-demo
 * project, fake Acme data). The events below are the moments where the film
 * moves between two captured states of the same screen.
 *
 *  #  | Beat        | Frames     | Real UI
 *  S1 | Hook        | 0–119      | motion typography, caret close-up, pull back
 *  S2 | Database    | 120–359    | Table Editor: Insert → row lands; SQL Editor: type, Run, results
 *  S3 | Auth        | 360–569    | Users: Add user → Create user dialog → new user row
 *  S4 | Realtime    | 570–749    | Inspector: broadcast dialog → message arrives → payload detail
 *  S5 | Storage     | 750–839    | avatars bucket: upload → two files land → preview
 *     | Edge        | 840–929    | hard cut at 840: functions list → send-welcome → Test → 200
 *  S6 | Vector      | 930–1109   | documents.embedding → similarity query → nearest rows
 *  S7 | Pull-back   | 1110–1259  | pull out to every screen, hold, push to black
 *  S8 | End card    | 1260–1439  | logo impact at 1260, readable hold 1350–1439
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** 120 BPM. */
export const BEAT = 15;
export const BAR = BEAT * 4;
/** 24 bars — the whole score. */
export const DURATION_IN_FRAMES = BAR * 24;

export const beats = (n: number): number => n * BEAT;

export const SCENES = {
  hook: { from: 0, to: 120 },
  database: { from: 120, to: 360 },
  auth: { from: 360, to: 570 },
  realtime: { from: 570, to: 750 },
  storage: { from: 750, to: 840 },
  edge: { from: 840, to: 930 },
  vector: { from: 930, to: 1110 },
  pullback: { from: 1110, to: 1260 },
  end: { from: 1260, to: DURATION_IN_FRAMES },
} as const;

/** The deliberate hard cut of beat 5. */
export const CUT_FRAME = 840;

export const HOOK = {
  words: ["Start", "with", "a", "database."],
  /** One word per eighth note from the first beat. */
  wordFrames: [15, 23, 30, 38],
  highlight: 52,
  subline: 72,
} as const;

/** Crossfade length between two captured states of one screen. */
export const STATE_FADE = 5;
/** A row sliding in between existing rows. */
export const ROW_INSERT = 12;

export const DB = {
  cursorIn: 168,
  insertClick: 198,
  rowClick: 218,
  rowInsert: 226,
  /** Camera push onto the new row (see shots.ts). */
  rowZoom: 240,
  sqlTypeStart: 282,
  sqlCharsPerFrame: 3,
  runClick: 328,
  resultsIn: 330,
} as const;

export const AUTH = {
  cursorIn: 388,
  addUserClick: 414,
  createNewClick: 432,
  createUserClick: 456,
  dialogOut: 458,
  rowInsert: 466,
  /** The camera's push onto the new user. */
  rowZoom: 480,
  highlightPulse: 510,
} as const;

export const REALTIME = {
  cursorIn: 596,
  broadcastClick: 616,
  confirmClick: 645,
  dialogOut: 647,
  arrive: 653,
  rowClick: 680,
  detailIn: 682,
} as const;

export const STORAGE = {
  cursorIn: 766,
  uploadClick: 784,
  rowInsert: 788,
  previewClick: 816,
  previewIn: 818,
} as const;

export const EDGE = {
  cursorIn: 842,
  rowClick: 856,
  testClick: 884,
  panelIn: 886,
  sendClick: 902,
  responseIn: 906,
} as const;

export const VECTOR = {
  columnFocus: 958,
  typeStart: 1030,
  charsPerFrame: 3,
  runClick: 1072,
  resultsIn: 1074,
  topRow: 1086,
} as const;

export const PULLBACK = {
  start: 1110,
  settled: 1170,
  labelsIn: 1150,
  labelsOut: 1212,
  pushStart: 1215,
  pushEnd: 1260,
} as const;

export const END = {
  logoIn: 1260,
  taglineIn: 1284,
  creditIn: 1318,
} as const;
