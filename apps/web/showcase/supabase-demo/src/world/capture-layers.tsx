import type { CSSProperties, ReactNode } from "react";
import { Img, interpolate } from "remotion";
import { COLORS } from "../theme";
import { CLAMP, ease } from "../lib/anim";
import { MONACO, captureSrc, type CaptureId, type RowInsert } from "../captures";
import { UNIT, type Rect } from "./layout";

/**
 * capture-layers.tsx — the primitives every real screen is built from.
 *
 * A capture is drawn at 1920×1080 CSS px (its 3840×2160 pixels at 2×), so
 * every rect in captures.ts is a panel-local coordinate here. Motion between
 * two captured states of one screen is always one of:
 *  - a crossfade of the whole state (menus, dialogs, selection changes);
 *  - a crop of the next state laid over the current one (a menu, a side panel);
 *  - a row insert: the strip below the row slides down and the row is revealed
 *    from the "after" capture;
 *  - a typing reveal: per-line clip masks of the finished query.
 */

const FULL: CSSProperties = { position: "absolute", left: 0, top: 0, width: UNIT.w, height: UNIT.h };

/** One whole captured state. */
export const Shot: React.FC<{ id: CaptureId; opacity?: number }> = ({ id, opacity = 1 }) =>
  opacity <= 0.001 ? null : <Img src={captureSrc(id)} style={{ ...FULL, opacity }} />;

/**
 * A rectangle of a capture, drawn where it sits on the screen. `dx`/`dy`
 * translate the region (slides); the clip travels with it.
 */
export const Crop: React.FC<{
  id: CaptureId;
  rect: Rect;
  dx?: number;
  dy?: number;
  opacity?: number;
  style?: CSSProperties;
}> = ({ id, rect, dx = 0, dy = 0, opacity = 1, style }) =>
  opacity <= 0.001 ? null : (
    <div
      style={{
        position: "absolute",
        left: rect.x + dx,
        top: rect.y + dy,
        width: rect.w,
        height: rect.h,
        overflow: "hidden",
        opacity,
        ...style,
      }}
    >
      <Img src={captureSrc(id)} style={{ ...FULL, left: -rect.x, top: -rect.y }} />
    </div>
  );

/** A crossfade weight: 0 before `at`, 1 once `at + frames` has passed. */
export const fadeIn = (frame: number, at: number, frames: number): number =>
  interpolate(frame, [at, at + frames], [0, 1], CLAMP);

/**
 * A sequence of whole-screen states. Each entry takes over at `at` with a
 * `fade`-frame crossfade; only the states that are actually on screen mount.
 */
export type State = { id: CaptureId; at: number; fade?: number };

export const States: React.FC<{ frame: number; states: readonly State[] }> = ({ frame, states }) => {
  let base = 0;
  states.forEach((s, i) => {
    if (frame >= s.at + (s.fade ?? 0)) {
      base = i;
    }
  });
  const next = states[base + 1];
  const mix = next ? fadeIn(frame, next.at, next.fade ?? 0) : 0;
  return (
    <>
      <Shot id={states[base].id} />
      {next && mix > 0 ? <Shot id={next.id} opacity={mix} /> : null}
    </>
  );
};

/* -------------------------------------------------------------- row insert */

/** 0→1 over ROW_INSERT frames with a soft landing. */
export const insertProgress = (frame: number, at: number, frames: number): number =>
  interpolate(frame, [at, at + frames], [0, 1], { ...CLAMP, easing: ease.out });

/**
 * The row insert: `before` stays put above the row, the strip below it slides
 * down by `p * h` (clipped at `bottom`, so nothing spills over the footer) and
 * the new row, taken from `after`, slides down with it into the space it opens. A brief green
 * wash marks the new row. Swap to the `after` capture once `p` reaches 1 —
 * the pixels are identical by then.
 */
export const RowInsertLayer: React.FC<{
  before: CaptureId;
  after: CaptureId;
  row: RowInsert;
  p: number;
  flash: number;
  flashRect: Rect;
}> = ({ before, after, row, p, flash, flashRect }) => {
  const width = row.x1 - row.x0;
  const open = row.h * p;
  return (
    <>
      <Shot id={before} />
      <div
        style={{
          position: "absolute",
          left: row.x0,
          top: row.y,
          width,
          height: row.bottom - row.y,
          overflow: "hidden",
        }}
      >
        <Img src={captureSrc(before)} style={{ ...FULL, left: -row.x0, top: -row.y + open }} />
      </div>
      {/* The new rows slide out from under the row above, riding the strip:
          their bottom edge is glued to the strip's top, so the only cut edge
          is the row divider above — never a sliced line of text. */}
      <div
        style={{
          position: "absolute",
          left: row.x0,
          top: row.y,
          width,
          height: Math.max(0, open),
          overflow: "hidden",
          opacity: interpolate(p, [0, 0.5], [0, 1], CLAMP),
        }}
      >
        <Img src={captureSrc(after)} style={{ ...FULL, left: -row.x0, top: -row.y + open - row.h }} />
      </div>
      <RowFlash rect={flashRect} strength={flash} />
    </>
  );
};

/** The green wash on a freshly landed row. */
export const RowFlash: React.FC<{ rect: Rect; strength: number }> = ({ rect, strength }) =>
  strength <= 0.001 ? null : (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        background: `rgba(62,207,142,${0.2 * strength})`,
        boxShadow: `inset 0 0 0 1px rgba(62,207,142,${0.55 * strength})`,
      }}
    />
  );

/** Flash envelope for a row that finishes landing at `landed`. */
export const flashAt = (frame: number, start: number, landed: number, hold = 22): number =>
  interpolate(frame, [start, landed, landed + hold], [0, 1, 0], CLAMP);

/* ------------------------------------------------------------------ typing */

export type TypingPlan = { lines: readonly string[]; start: number; charsPerFrame: number };

/** Characters typed so far on each line. A line break costs one keystroke. */
export const typedPerLine = (plan: TypingPlan, frame: number): number[] => {
  let budget = Math.max(0, Math.floor((frame - plan.start) * plan.charsPerFrame));
  return plan.lines.map((line) => {
    const n = Math.min(line.length, budget);
    budget = Math.max(0, budget - line.length - 1);
    return n;
  });
};

export const typingEnd = (plan: TypingPlan): number => {
  const keys = plan.lines.reduce((sum, line) => sum + line.length + 1, -1);
  return plan.start + Math.ceil(keys / plan.charsPerFrame);
};

/**
 * The finished query revealed line by line from `typed`, over whatever editor
 * state is beneath, with Monaco's caret at the insertion point. Line numbers
 * appear as each line is started, the way the editor grows them.
 */
export const TypingLayer: React.FC<{
  typed: CaptureId;
  plan: TypingPlan;
  frame: number;
  caretVisible: boolean;
}> = ({ typed, plan, frame, caretVisible }) => {
  const counts = typedPerLine(plan, frame);
  const started = counts.map((n, i) => n > 0 || (i === 0 && frame >= plan.start));
  const lastLine = Math.max(0, started.lastIndexOf(true));
  const caretX = MONACO.textLeft + counts[lastLine] * MONACO.charWidth;
  const top = (i: number) => MONACO.firstLineY + i * MONACO.lineHeight;
  if (frame < plan.start) {
    return null;
  }
  return (
    <>
      {counts.map((n, i) =>
        started[i] ? (
          <Crop
            key={i}
            id={typed}
            rect={{
              x: MONACO.gutterLeft,
              y: top(i),
              w: MONACO.textLeft - MONACO.gutterLeft + n * MONACO.charWidth + 0.5,
              h: MONACO.lineHeight,
            }}
          />
        ) : null,
      )}
      {caretVisible ? (
        <div
          style={{
            position: "absolute",
            left: caretX,
            top: top(lastLine) + 1,
            width: 2,
            height: MONACO.lineHeight - 2,
            background: "#E6E6E6",
          }}
        />
      ) : null}
    </>
  );
};

/* ------------------------------------------------------------- emphasis */

/** A green focus ring around a rect, drawn just outside it. */
export const Ring: React.FC<{ rect: Rect; strength: number; pad?: number; radius?: number }> = ({
  rect,
  strength,
  pad = 3,
  radius = 6,
}) =>
  strength <= 0.001 ? null : (
    <div
      style={{
        position: "absolute",
        left: rect.x - pad,
        top: rect.y - pad,
        width: rect.w + pad * 2,
        height: rect.h + pad * 2,
        borderRadius: radius,
        border: `2px solid ${COLORS.green}`,
        boxShadow: `0 0 18px rgba(62,207,142,${0.55 * strength})`,
        opacity: strength,
      }}
    />
  );

/** Everything but `rect` steps back; the rect keeps a ring. */
export const Spotlight: React.FC<{ rect: Rect; strength: number; children?: ReactNode }> = ({
  rect,
  strength,
  children,
}) =>
  strength <= 0.001 ? null : (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          borderRadius: 4,
          boxShadow: `0 0 0 3000px rgba(8,8,8,${0.62 * strength})`,
        }}
      />
      <Ring rect={rect} strength={strength} pad={2} radius={5} />
      {children}
    </div>
  );
