import { Easing, interpolate } from "remotion";
import { AUTH, DB, EDGE, HEIGHT, HOOK, PULLBACK, REALTIME, STORAGE, VECTOR, WIDTH } from "../timeline";
import { AUTH_UI, MONACO, REALTIME_UI, STORAGE_UI, TABLE, VECTOR_UI } from "../captures";
import { PANELS, WORLD, center, type PanelId, type Point, type Rect } from "../world/layout";
import { createCamera, type Camera, type Move } from "./rig";
import { hookCaretX, HOOK_TEXT, type HookMetrics } from "./hook-metrics";

/**
 * shots.ts — every framing in the film and the moves between them.
 *
 * Two kinds of framing:
 *  - `screen(id)`: the whole capture as a floating window (s 0.97 leaves a
 *    thin margin of world around it, so the rounded corners and shadow read);
 *  - `detail(id, point, s)`: a push-in on the action. The centre is clamped
 *    so the viewport never leaves the panel, and s stays ≤ 1.8 (2 is 1:1 with
 *    the capture's pixels, the sharpest the film may go).
 */

const WINDOW_SCALE = 0.97;
const HOOK_SCALE = 1.36;
const MAX_DETAIL = 1.8;

const at = (point: Point, s: number): Camera => ({ ...point, s });

const clampAxis = (value: number, min: number, size: number, view: number): number =>
  view >= size ? min + size / 2 : Math.min(Math.max(value, min + view / 2), min + size - view / 2);

const screen = (id: PanelId): Camera => at(center(PANELS[id]), WINDOW_SCALE);

const detail = (id: PanelId, local: Point, s: number): Camera => {
  const panel = PANELS[id];
  const scale = Math.min(s, MAX_DETAIL);
  return {
    x: clampAxis(panel.x + local.x, panel.x, panel.w, WIDTH / scale),
    y: clampAxis(panel.y + local.y, panel.y, panel.h, HEIGHT / scale),
    s: scale,
  };
};

const mid = (r: Rect): Point => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

export const SHOTS = {
  hookPanel: at(center(PANELS.hook), HOOK_SCALE),
  table: screen("table"),
  tableRow: detail("table", mid(TABLE.newRowCells), 1.6),
  sql: screen("sql"),
  sqlCode: detail("sql", { x: MONACO.textLeft + 200, y: MONACO.firstLineY + 40 }, 1.5),
  auth: screen("auth"),
  // Biased up: the rows above give the new one context, the empty table below doesn't.
  authRow: detail("auth", { x: mid(AUTH_UI.newEmail).x, y: AUTH_UI.newRow.y - 60 }, 1.6),
  realtime: screen("realtime"),
  realtimePayload: detail("realtime", mid(REALTIME_UI.payload), 1.6),
  storage: screen("storage"),
  storagePreview: detail("storage", mid(STORAGE_UI.previewImage), 1.3),
  edgeList: screen("edgeList"),
  edge: screen("edge"),
  vector: screen("vector"),
  vectorColumn: detail("vector", mid(VECTOR_UI.embeddingColumn), 1.6),
  vectorSql: screen("vectorSql"),
  vectorCode: detail("vectorSql", { x: MONACO.textLeft + 200, y: MONACO.firstLineY + 50 }, 1.45),
  vectorTop: detail("vectorSql", mid(VECTOR_UI.topResult), 1.7),
  overview: at(center(WORLD), 0.21),
  endPush: at(center(WORLD), 0.4),
} as const;

const SNAP = Easing.bezier(0.8, 0, 0.15, 1);
/** A slow lean in while something is being typed: the words must stay readable. */
const LEAN = Easing.bezier(0.45, 0, 0.3, 1);

export const MOVES: readonly Move[] = [
  { kind: "travel", start: 105, end: 135, to: SHOTS.table },
  { kind: "glide", start: DB.rowZoom, end: DB.rowZoom + 16, to: SHOTS.tableRow, easing: SNAP },
  { kind: "travel", start: 256, end: DB.sqlTypeStart, to: SHOTS.sql },
  { kind: "glide", start: DB.sqlTypeStart - 2, end: DB.sqlTypeStart + 26, to: SHOTS.sqlCode, easing: LEAN, blur: 0.25 },
  { kind: "glide", start: DB.runClick - 16, end: DB.runClick - 2, to: SHOTS.sql },
  { kind: "travel", start: 345, end: 375, to: SHOTS.auth },
  { kind: "glide", start: AUTH.rowZoom, end: AUTH.rowZoom + 18, to: SHOTS.authRow, easing: SNAP },
  { kind: "travel", start: 555, end: 585, to: SHOTS.realtime },
  { kind: "glide", start: REALTIME.detailIn + 8, end: REALTIME.detailIn + 26, to: SHOTS.realtimePayload, easing: SNAP },
  { kind: "travel", start: 735, end: 765, to: SHOTS.storage },
  { kind: "glide", start: STORAGE.previewIn + 2, end: 838, to: SHOTS.storagePreview },
  { kind: "cut", start: 840, end: 840, to: SHOTS.edgeList },
  // The page change: the list slides away and the function's page slides in.
  { kind: "glide", start: EDGE.rowClick + 2, end: EDGE.rowClick + 16, to: SHOTS.edge, drift: 0 },
  // The 200 needs to be read, so the travel waits for it instead of a push-in.
  { kind: "travel", start: EDGE.responseIn + 14, end: 948, to: SHOTS.vector },
  { kind: "glide", start: VECTOR.columnFocus + 2, end: VECTOR.columnFocus + 20, to: SHOTS.vectorColumn },
  { kind: "travel", start: 996, end: VECTOR.typeStart - 4, to: SHOTS.vectorCode },
  { kind: "glide", start: VECTOR.runClick - 14, end: VECTOR.runClick - 2, to: SHOTS.vectorSql },
  { kind: "glide", start: VECTOR.topRow - 6, end: VECTOR.topRow + 12, to: SHOTS.vectorTop, easing: SNAP },
  { kind: "pull", start: PULLBACK.start, end: PULLBACK.settled, to: SHOTS.overview, drift: 0.00018 },
  {
    kind: "glide",
    start: PULLBACK.pushStart,
    end: PULLBACK.pushEnd,
    to: SHOTS.endPush,
    easing: Easing.bezier(0.6, 0, 0.9, 0.6),
    drift: 0,
  },
];

/** The frames where a move is at full speed — used for QA stills. */
export const TRAVEL_PEAKS = MOVES.filter((m) => m.kind !== "cut").map((m) =>
  Math.round((m.start + m.end) / 2),
);

export const CUTS = MOVES.filter((m) => m.kind === "cut").map((m) => m.start);

/** The motion-blur weight of whichever move is running at `frame`. */
export const blurWeight = (frame: number): number => {
  const running = MOVES.filter((m) => frame >= m.start && frame <= m.end + 10);
  return running.length === 0 ? 1 : (running[running.length - 1].blur ?? 1);
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OPEN_SCALE = 2.25;
/** World units the opening frame leads the caret by. */
const LEAD = 250;

/**
 * The opening shot: the lens starts on the caret, rides it as the words land,
 * then pulls back until the line is sitting inside its panel.
 */
const hookCamera = (metrics: HookMetrics) => (frame: number): Camera => {
  const pull = interpolate(frame, [HOOK.wordFrames[0] + 2, 100], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.5, 0, 0.2, 1),
  });
  const settle = interpolate(frame, [HOOK.wordFrames[1], 100], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.25, 1),
  });
  // The caret sits on the left third so the words type into open space, and
  // the opening frame is all panel, no edges.
  const follow = hookCaretX(metrics, frame - 2) + LEAD * (1 - pull);
  const s = Math.exp(Math.log(OPEN_SCALE) + (Math.log(SHOTS.hookPanel.s) - Math.log(OPEN_SCALE)) * pull);
  return {
    x: follow + (SHOTS.hookPanel.x - follow) * settle,
    y: HOOK_TEXT.centerY + (SHOTS.hookPanel.y - HOOK_TEXT.centerY) * settle,
    s,
  };
};

export const createFilmCamera = (metrics: HookMetrics) =>
  createCamera(hookCamera(metrics), MOVES);
