import { staticFile } from "remotion";
import type { Rect } from "./world/layout";

/**
 * captures.ts — the real dashboard screens and where things are on them.
 *
 * Every PNG in public/supabase-demo/captures was taken from the live Supabase
 * dashboard (project "acme-demo", seeded with fake Acme data) at 1920×1080 CSS
 * px and device scale 2, after a privacy scrub (org/user names → "Acme",
 * profile photo → an "A" disc, project ref and keys blanked, timestamps in UTC).
 *
 * Every rect below is panel-local CSS px, read with getBoundingClientRect in
 * the same session that took the capture — never eyeballed. Overlays (cursor
 * targets, rings, typing masks, row inserts) are drawn from these numbers.
 */

const DIR = "supabase-demo/captures";

export const CAPTURE = {
  tableBefore: "table-profiles-before.png",
  tableAfter: "table-profiles-after.png",
  tableInsertMenu: "table-insert-menu.png",
  sqlEmpty: "sql-empty.png",
  sqlBlank: "sql-blank.png",
  sqlTyped: "sql-typed.png",
  sqlResults: "sql-results.png",
  authBefore: "auth-users-before.png",
  authAddMenu: "auth-add-menu.png",
  authDialog: "auth-create-dialog.png",
  authAfter: "auth-users-after.png",
  realtimeBefore: "realtime-before.png",
  realtimeDialog: "realtime-broadcast-dialog.png",
  realtimeAfter: "realtime-after.png",
  realtimeSelected: "realtime-selected.png",
  messages: "realtime-messages-table.png",
  storageBefore: "storage-before.png",
  storageAfter: "storage-after.png",
  storagePreview: "storage-preview.png",
  edgeList: "edge-list.png",
  edgeDetail: "edge-detail.png",
  edgeTestBefore: "edge-test-before.png",
  edgeTestAfter: "edge-test-after.png",
  vectorDocuments: "vector-documents.png",
  vectorSqlTyped: "vector-sql-typed.png",
  vectorSqlResults: "vector-sql-results.png",
  schema: "schema-visualizer.png",
} as const;

export type CaptureId = keyof typeof CAPTURE;

export const captureSrc = (id: CaptureId): string => staticFile(`${DIR}/${CAPTURE[id]}`);

const r = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

/** A row block that appears between existing rows; everything below slides down by `h`. */
export type RowInsert = { y: number; h: number; x0: number; x1: number; bottom: number };

/* ----------------------------------------------------------- Monaco editor */

/** Monaco in the SQL editor: 13 px JetBrains-style mono, 20 px lines. */
export const MONACO = {
  textLeft: 360,
  gutterLeft: 305,
  firstLineY: 142,
  lineHeight: 20,
  /** 234.8 px for the 30-character first line of the profiles query. */
  charWidth: 234.8 / 30,
  /** The editor surface (below the toolbar, above the results pane). */
  surface: r(305, 138, 1600, 470),
  /** Everything from the results tab bar down. */
  resultsPane: r(305, 610, 1615, 470),
  run: r(1832.5, 103.5, 71.5, 26),
} as const;

export const SQL_QUERY = [
  "select plan, count(*) as users",
  "from profiles",
  "group by plan",
  "order by users desc;",
] as const;

export const VECTOR_QUERY = [
  "select title,",
  "  embedding <-> '[0.9,0.3,0.3]' as distance",
  "from documents",
  "order by distance",
  "limit 5;",
] as const;

/* ------------------------------------------------------------------ table */

export const TABLE = {
  insertButton: r(1839, 103, 75, 26),
  /** The Insert dropdown, button included, as it appears in tableInsertMenu. */
  insertMenu: r(1650, 96, 270, 140),
  insertRowItem: r(1666, 138, 240, 28),
  newRow: { y: 172, h: 35, x0: 305, x1: 1920, bottom: 1040 } satisfies RowInsert,
  newRowCells: r(305, 172, 1224, 35),
  usernameCell: r(490, 172, 250, 35),
} as const;

export const SQL = {
  resultsGrid: r(305, 652, 200, 175),
} as const;

/* ------------------------------------------------------------------- auth */

export const AUTH_UI = {
  addUser: r(1802, 108, 94, 26),
  addMenu: r(1688, 138, 208, 66),
  createNewItem: r(1694, 172, 196, 28),
  createUser: r(793, 665, 334, 34),
  newRow: { y: 579, h: 44, x0: 305, x1: 1920, bottom: 1044 } satisfies RowInsert,
  newRowCells: r(305, 579, 1615, 44),
  newEmail: r(864, 579, 312, 44),
} as const;

/* --------------------------------------------------------------- realtime */

export const REALTIME_UI = {
  broadcast: r(931, 103, 165, 26),
  confirm: r(1129, 684, 66, 26),
  newRow: { y: 134, h: 40, x0: 305, x1: 1113, bottom: 1080 } satisfies RowInsert,
  newRowCells: r(305, 134, 808, 40),
  newRowStamp: r(365, 144, 179, 20),
  payload: r(1135, 372, 420, 156),
} as const;

/* ---------------------------------------------------------------- storage */

export const STORAGE_UI = {
  upload: r(1794, 107, 110, 26),
  newRows: { y: 254, h: 74, x0: 305, x1: 1920, bottom: 1045 } satisfies RowInsert,
  newRowCells: r(305, 254, 1615, 74),
  leoName: r(345, 300, 100, 19),
  previewImage: r(1580, 202, 324, 288),
} as const;

/* ------------------------------------------------------------------- edge */

export const EDGE_UI = {
  listRow: r(354, 283, 1518, 67),
  listName: r(370, 299, 113, 35),
  test: r(1838, 59, 66, 26),
  /** The Test side panel, full height. */
  testPanel: r(1280, 0, 640, 1080),
  send: r(1800, 1042, 100, 26),
  /** Response body area inside the Test panel. */
  response: r(1281, 632, 639, 396),
  responseBody: r(1292, 684, 310, 96),
  status: r(1866, 643, 34, 18),
} as const;

/* ----------------------------------------------------------------- vector */

export const VECTOR_UI = {
  embeddingColumn: r(990, 137, 150, 455),
  resultsGrid: r(305, 652, 297, 210),
  topResult: r(305, 688, 297, 35),
} as const;
