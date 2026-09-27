import { DB, VECTOR } from "../timeline";
import { caretOn } from "../lib/anim";
import { SQL, SQL_QUERY, TABLE, VECTOR_QUERY, VECTOR_UI, type CaptureId } from "../captures";
import type { Rect } from "../world/layout";
import { Crop, Ring, RowFlash, States, TypingLayer, fadeIn, typingEnd, type TypingPlan } from "../world/capture-layers";
import { InsertScreen, pulse } from "./shared";

/**
 * database.tsx — Table Editor and SQL Editor.
 *
 * Table: the Insert menu opens as a crop of its capture (the menu capture
 * already contains the new row, so only the menu region is borrowed), then
 * "Insert row" lands sam_rivera at the top of the grid.
 *
 * SQL: the empty editor's placeholder gives way to the blank editor on the
 * first keystroke; the query is revealed line by line from the finished
 * capture, and Run crossfades to the results.
 */

const MENU_FADE = 4;
/** Results replace the "Click Run" hint in place; a long fade ghosts the two. */
const RESULTS_FADE = 3;

export const TableScreen: React.FC<{ frame: number }> = ({ frame }) => {
  const menu = fadeIn(frame, DB.insertClick, MENU_FADE) * (1 - fadeIn(frame, DB.rowClick, MENU_FADE));
  return (
    <>
      <InsertScreen
        frame={frame}
        before={[{ id: "tableBefore", at: 0 }]}
        beforeId="tableBefore"
        afterId="tableAfter"
        row={TABLE.newRow}
        insertAt={DB.rowInsert}
        flashRect={TABLE.newRowCells}
      />
      <Crop id="tableInsertMenu" rect={TABLE.insertMenu} opacity={menu} />
      <Ring rect={TABLE.newRowCells} strength={pulse(frame, DB.rowZoom - 2, DB.rowZoom + 30)} pad={1} radius={3} />
    </>
  );
};

export const SQL_PLAN: TypingPlan = { lines: SQL_QUERY, start: DB.sqlTypeStart, charsPerFrame: DB.sqlCharsPerFrame };
export const VECTOR_PLAN: TypingPlan = { lines: VECTOR_QUERY, start: VECTOR.typeStart, charsPerFrame: VECTOR.charsPerFrame };

type EditorProps = {
  frame: number;
  plan: TypingPlan;
  typed: CaptureId;
  results: CaptureId;
  runClick: number;
  resultsIn: number;
  /** Emphasis on the answer once it is in. */
  highlight: { rect: Rect; from: number; to: number; flash?: boolean };
};

/** Placeholder → blank on the first keystroke → typed reveal → Run → results. */
export const EditorScreen: React.FC<EditorProps> = ({ frame, plan, typed, results, runClick, resultsIn, highlight }) => {
  const end = typingEnd(plan);
  const typing = frame >= plan.start && frame < resultsIn + RESULTS_FADE;
  const strength = pulse(frame, highlight.from, highlight.to);
  return (
    <>
      <States
        frame={frame}
        states={[
          { id: "sqlEmpty", at: 0 },
          { id: "sqlBlank", at: plan.start, fade: 2 },
          { id: results, at: resultsIn, fade: RESULTS_FADE },
        ]}
      />
      {typing ? (
        <TypingLayer typed={typed} plan={plan} frame={frame} caretVisible={frame < runClick && caretOn(frame, end)} />
      ) : null}
      {highlight.flash ? <RowFlash rect={highlight.rect} strength={strength * 0.8} /> : null}
      <Ring rect={highlight.rect} strength={strength} pad={1} radius={3} />
    </>
  );
};

export const SqlScreen: React.FC<{ frame: number }> = ({ frame }) => (
  <EditorScreen
    frame={frame}
    plan={SQL_PLAN}
    typed="sqlTyped"
    results="sqlResults"
    runClick={DB.runClick}
    resultsIn={DB.resultsIn}
    highlight={{ rect: SQL.resultsGrid, from: DB.resultsIn + 4, to: DB.resultsIn + 40 }}
  />
);

export const VectorSqlScreen: React.FC<{ frame: number }> = ({ frame }) => (
  <EditorScreen
    frame={frame}
    plan={VECTOR_PLAN}
    typed="vectorSqlTyped"
    results="vectorSqlResults"
    runClick={VECTOR.runClick}
    resultsIn={VECTOR.resultsIn}
    highlight={{ rect: VECTOR_UI.topResult, from: VECTOR.topRow, to: VECTOR.topRow + 60, flash: true }}
  />
);
