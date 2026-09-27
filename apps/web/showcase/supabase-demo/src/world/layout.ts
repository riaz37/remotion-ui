/**
 * layout.ts — where everything lives on the world canvas.
 *
 * v2: every panel is one real dashboard screen, captured at 1920×1080 CSS px
 * (3840×2160 image pixels). A panel is 1920×1080 world units, so panel-local
 * coordinates are exactly the CSS pixels measured in the browser with
 * getBoundingClientRect — no conversion — and a camera scale of 2 is 1:1 with
 * the capture's pixels (the sharpest the film may push).
 *
 *   Hook      | Auth      | Realtime   | Messages
 *   Table     | SQL       | Storage    | Vector
 *   Schema    | Edge list | Edge fn    | Vector SQL
 */

export type Rect = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };

export const UNIT = { w: 1920, h: 1080 } as const;
export const GAP = 240;

const col = (i: number) => i * (UNIT.w + GAP);
const row = (i: number) => i * (UNIT.h + GAP);
const cell = (c: number, r: number): Rect => ({ x: col(c), y: row(r), w: UNIT.w, h: UNIT.h });

export const PANELS = {
  /** The hook is typography, sized like the v1 hook card and centred in its cell. */
  hook: { x: col(0) + 320, y: row(0) + 180, w: 1280, h: 720 },
  auth: cell(1, 0),
  realtime: cell(2, 0),
  messages: cell(3, 0),
  table: cell(0, 1),
  sql: cell(1, 1),
  storage: cell(2, 1),
  vector: cell(3, 1),
  schema: cell(0, 2),
  edgeList: cell(1, 2),
  edge: cell(2, 2),
  vectorSql: cell(3, 2),
} as const satisfies Record<string, Rect>;

export type PanelId = keyof typeof PANELS;

export const WORLD: Rect = {
  x: 0,
  y: 0,
  w: col(3) + UNIT.w,
  h: row(2) + UNIT.h,
};

export const center = (r: Rect): Point => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/** A point given in a panel's local (CSS px) coordinates, lifted to the world. */
export const inPanel = (id: PanelId, local: Point): Point => ({
  x: PANELS[id].x + local.x,
  y: PANELS[id].y + local.y,
});

/** Centre of a panel-local rect, lifted to the world. */
export const rectCenter = (id: PanelId, r: Rect): Point =>
  inPanel(id, { x: r.x + r.w / 2, y: r.y + r.h / 2 });

export const PANEL_RADIUS = 18;

/** Height of the drawn window header on the typographic hook panel. */
export const PANEL_HEADER = 72;
