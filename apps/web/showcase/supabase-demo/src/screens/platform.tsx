import { interpolate } from "remotion";
import { AUTH, EDGE, REALTIME, STATE_FADE, STORAGE, VECTOR } from "../timeline";
import { CLAMP, ease } from "../lib/anim";
import { AUTH_UI, EDGE_UI, REALTIME_UI, STORAGE_UI, VECTOR_UI } from "../captures";
import { Crop, Ring, Shot, Spotlight, States, fadeIn } from "../world/capture-layers";
import { InsertScreen, pulse } from "./shared";

/**
 * platform.tsx — Auth, Realtime, Storage, Edge Functions and the vector table.
 *
 * Menus and dialogs are whole-screen captures, so they crossfade in a few
 * frames, the way a real popover appears. Rows land with the shared insert.
 */

const MENU_FADE = 4;

export const AuthScreen: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <InsertScreen
      frame={frame}
      before={[
        { id: "authBefore", at: 0 },
        { id: "authAddMenu", at: AUTH.addUserClick, fade: MENU_FADE },
        { id: "authDialog", at: AUTH.createNewClick, fade: STATE_FADE },
        { id: "authBefore", at: AUTH.dialogOut, fade: STATE_FADE },
      ]}
      beforeId="authBefore"
      afterId="authAfter"
      row={AUTH_UI.newRow}
      insertAt={AUTH.rowInsert}
      flashRect={AUTH_UI.newRowCells}
    />
    <Ring rect={AUTH_UI.newEmail} strength={pulse(frame, AUTH.highlightPulse, AUTH.highlightPulse + 40)} pad={0} radius={4} />
  </>
);

export const RealtimeScreen: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <InsertScreen
      frame={frame}
      before={[
        { id: "realtimeBefore", at: 0 },
        { id: "realtimeDialog", at: REALTIME.broadcastClick, fade: STATE_FADE },
        { id: "realtimeBefore", at: REALTIME.dialogOut, fade: STATE_FADE },
      ]}
      beforeId="realtimeBefore"
      afterId="realtimeAfter"
      row={REALTIME_UI.newRow}
      insertAt={REALTIME.arrive}
      after={[{ id: "realtimeSelected", at: REALTIME.detailIn, fade: STATE_FADE }]}
      flashRect={REALTIME_UI.newRowCells}
    />
    <Ring rect={REALTIME_UI.payload} strength={pulse(frame, REALTIME.detailIn + 10, REALTIME.detailIn + 56)} pad={6} radius={6} />
  </>
);

export const StorageScreen: React.FC<{ frame: number }> = ({ frame }) => (
  <InsertScreen
    frame={frame}
    before={[{ id: "storageBefore", at: 0 }]}
    beforeId="storageBefore"
    afterId="storageAfter"
    row={STORAGE_UI.newRows}
    insertAt={STORAGE.rowInsert}
    after={[{ id: "storagePreview", at: STORAGE.previewIn, fade: STATE_FADE }]}
    flashRect={STORAGE_UI.newRowCells}
  />
);

/** The function row lights under the cursor just before the click. */
export const EdgeListScreen: React.FC<{ frame: number }> = ({ frame }) => {
  const hover = interpolate(frame, [EDGE.rowClick - 8, EDGE.rowClick - 3], [0, 1], CLAMP);
  return (
    <>
      <Shot id="edgeList" />
      {hover > 0 ? (
        <div
          style={{
            position: "absolute",
            left: EDGE_UI.listRow.x,
            top: EDGE_UI.listRow.y,
            width: EDGE_UI.listRow.w,
            height: EDGE_UI.listRow.h,
            background: `rgba(255,255,255,${0.045 * hover})`,
          }}
        />
      ) : null}
    </>
  );
};

const PANEL_SLIDE = 10;

/**
 * Detail page → the Test sheet slides in from the right edge (a crop of the
 * sheet from its capture) → once it has landed the whole screen swaps to that
 * capture → Send crossfades the response area to the 200.
 */
export const EdgeScreen: React.FC<{ frame: number }> = ({ frame }) => {
  const slide = interpolate(frame, [EDGE.panelIn, EDGE.panelIn + PANEL_SLIDE], [0, 1], { ...CLAMP, easing: ease.out });
  const sliding = frame >= EDGE.panelIn && frame < EDGE.panelIn + PANEL_SLIDE + 3;
  const response = fadeIn(frame, EDGE.responseIn, STATE_FADE);
  return (
    <>
      <States
        frame={frame}
        states={[
          { id: "edgeDetail", at: 0 },
          { id: "edgeTestBefore", at: EDGE.panelIn + PANEL_SLIDE, fade: 3 },
        ]}
      />
      {sliding ? (
        <Crop
          id="edgeTestBefore"
          rect={EDGE_UI.testPanel}
          dx={(1 - slide) * EDGE_UI.testPanel.w}
          style={{ boxShadow: `-24px 0 60px rgba(0,0,0,${0.5 * (1 - slide)})` }}
        />
      ) : null}
      <Crop id="edgeTestAfter" rect={EDGE_UI.response} opacity={response} />
      <Ring rect={EDGE_UI.status} strength={pulse(frame, EDGE.responseIn + 4, EDGE.responseIn + 40)} pad={3} radius={9} />
    </>
  );
};

/** documents: the embedding column is the only thing lit. */
export const VectorDocsScreen: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <Shot id="vectorDocuments" />
    <Spotlight rect={VECTOR_UI.embeddingColumn} strength={pulse(frame, VECTOR.columnFocus, VECTOR.typeStart - 14, 12)} />
  </>
);
