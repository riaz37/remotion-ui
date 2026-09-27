import { interpolate, spring } from "remotion";
import { AUTH, DB, EDGE, FPS, REALTIME, STORAGE, VECTOR } from "../timeline";
import { COLORS } from "../theme";
import { CLAMP } from "../lib/anim";
import { toScreen, type Camera } from "../camera/rig";
import { AUTH_UI, EDGE_UI, MONACO, REALTIME_UI, STORAGE_UI, TABLE } from "../captures";
import { inPanel, rectCenter, type Point } from "../world/layout";

/**
 * Cursor — the hand, anchored to the world rather than the screen.
 *
 * Improves on the launch film's FilmCursor in three ways:
 *  - waypoints are world points, so the cursor rides every zoom and pan with
 *    the UI it is pointing at, and a target can never drift off its button;
 *  - it is drawn in screen space at a constant size, so a 1.6× push-in
 *    doesn't inflate the arrow into a cartoon;
 *  - hops travel on a shallow arc, the way a wrist moves, not a ruler line.
 * The landing ring and click ripple rules are kept: ring at the destination
 * once nearly arrived, never concentric with a ripple.
 *
 * Every target is the centre of a rect measured on the real capture
 * (captures.ts). Tracks never overlap in time.
 */

type Waypoint = { frame: number; at: Point };
type Track = { points: Waypoint[]; clicks: number[]; fadeOut: number };

/** Frames the tip rests on a target before pressing, and after releasing. */
const REST = 4;
const HOLD = 3;

type Target = { at: Point; click: number };

/**
 * A track from an entry point through a list of clicks: the tip arrives REST
 * frames before each press and stays put until HOLD frames after it, so the
 * press and ripple always happen on the target.
 */
const track = (enter: number, from: Point, targets: Target[], linger = 10): Track => ({
  points: [
    { frame: enter, at: from },
    ...targets.flatMap((t) => [
      { frame: t.click - REST, at: t.at },
      { frame: t.click + HOLD, at: t.at },
    ]),
  ],
  clicks: targets.map((t) => t.click),
  fadeOut: targets[targets.length - 1].click + linger,
});

export const CURSOR_TRACKS: Track[] = [
  track(DB.cursorIn, inPanel("table", { x: 1560, y: 520 }), [
    { at: rectCenter("table", TABLE.insertButton), click: DB.insertClick },
    { at: rectCenter("table", TABLE.insertRowItem), click: DB.rowClick },
  ]),
  track(DB.runClick - 18, inPanel("sql", { x: 1500, y: 380 }), [
    { at: rectCenter("sql", MONACO.run), click: DB.runClick },
  ]),
  track(AUTH.cursorIn, inPanel("auth", { x: 1500, y: 760 }), [
    { at: rectCenter("auth", AUTH_UI.addUser), click: AUTH.addUserClick },
    { at: rectCenter("auth", AUTH_UI.createNewItem), click: AUTH.createNewClick },
    { at: rectCenter("auth", AUTH_UI.createUser), click: AUTH.createUserClick },
  ]),
  track(REALTIME.cursorIn, inPanel("realtime", { x: 760, y: 620 }), [
    { at: rectCenter("realtime", REALTIME_UI.broadcast), click: REALTIME.broadcastClick },
    { at: rectCenter("realtime", REALTIME_UI.confirm), click: REALTIME.confirmClick },
    { at: rectCenter("realtime", REALTIME_UI.newRowStamp), click: REALTIME.rowClick },
  ]),
  track(STORAGE.cursorIn, inPanel("storage", { x: 1500, y: 620 }), [
    { at: rectCenter("storage", STORAGE_UI.upload), click: STORAGE.uploadClick },
    { at: rectCenter("storage", STORAGE_UI.leoName), click: STORAGE.previewClick },
  ]),
  track(EDGE.cursorIn, inPanel("edgeList", { x: 700, y: 560 }), [
    { at: rectCenter("edgeList", EDGE_UI.listName), click: EDGE.rowClick },
  ], 4),
  track(EDGE.testClick - 16, inPanel("edge", { x: 1500, y: 420 }), [
    { at: rectCenter("edge", EDGE_UI.test), click: EDGE.testClick },
    { at: rectCenter("edge", EDGE_UI.send), click: EDGE.sendClick },
  ], 8),
  track(VECTOR.runClick - 16, inPanel("vectorSql", { x: 1500, y: 380 }), [
    { at: rectCenter("vectorSql", MONACO.run), click: VECTOR.runClick },
  ]),
];

export const CURSOR_CLICKS = CURSOR_TRACKS.flatMap((t) => t.clicks);

const SIZE = 34;
const FADE = 6;
const RIPPLE = 16;
const PRESS = 5;
/** Arrow tip sits at (5,3) of the 24-unit viewBox. */
const TIP = { x: (5 / 24) * SIZE, y: (3 / 24) * SIZE };

const HOP = { damping: 20, stiffness: 120, mass: 0.9 } as const;

const worldPosition = (track: Track, frame: number): { pos: Point; landing: Point } => {
  const { points } = track;
  if (frame <= points[0].frame) {
    return { pos: points[0].at, landing: points[0].at };
  }
  for (let i = 0; i < points.length - 1; i += 1) {
    const from = points[i];
    const to = points[i + 1];
    if (frame < to.frame) {
      const t = spring({ frame: frame - from.frame, fps: FPS, config: HOP, durationInFrames: to.frame - from.frame });
      const dx = to.at.x - from.at.x;
      const dy = to.at.y - from.at.y;
      const arc = Math.sin(Math.PI * Math.min(1, t)) * 0.12;
      return {
        pos: { x: from.at.x + dx * t - dy * arc, y: from.at.y + dy * t + dx * arc },
        landing: to.at,
      };
    }
  }
  const last = points[points.length - 1].at;
  return { pos: last, landing: last };
};

export const Cursor: React.FC<{ frame: number; camera: Camera }> = ({ frame, camera }) => {
  const track = CURSOR_TRACKS.find((t) => frame >= t.points[0].frame && frame <= t.fadeOut + FADE);
  if (!track) {
    return null;
  }

  const opacity =
    interpolate(frame, [track.points[0].frame, track.points[0].frame + FADE], [0, 1], CLAMP) *
    interpolate(frame, [track.fadeOut, track.fadeOut + FADE], [1, 0], CLAMP);
  const { pos, landing } = worldPosition(track, frame);
  const screen = toScreen(camera, pos);
  const target = toScreen(camera, landing);

  const click = track.clicks.filter((c) => frame >= c).pop();
  const since = click === undefined ? Infinity : frame - click;
  const rippling = since < RIPPLE;
  const ripple = rippling ? spring({ frame: since, fps: FPS, config: { damping: 200 }, durationInFrames: RIPPLE }) : 0;
  const pressed = since < PRESS;

  const distance = Math.hypot(screen.x - target.x, screen.y - target.y);
  const ring = rippling || click === landingClick(track, landing) ? 0 : interpolate(distance, [6, 80], [0.5, 0], CLAMP);

  return (
    <div style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
      {ring > 0 ? (
        <div
          style={{
            position: "absolute",
            left: target.x - 30,
            top: target.y - 30,
            width: 60,
            height: 60,
            borderRadius: 999,
            border: `2.5px solid ${COLORS.green}`,
            opacity: ring,
          }}
        />
      ) : null}
      {rippling ? (
        <div
          style={{
            position: "absolute",
            left: screen.x - (10 + ripple * 34),
            top: screen.y - (10 + ripple * 34),
            width: 20 + ripple * 68,
            height: 20 + ripple * 68,
            borderRadius: 999,
            border: `3px solid ${COLORS.green}`,
            background: `rgba(62,207,142,${0.18 * (1 - ripple)})`,
            opacity: 1 - ripple,
          }}
        />
      ) : null}
      <svg
        width={SIZE}
        height={SIZE}
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: screen.x - TIP.x,
          top: screen.y - TIP.y,
          transform: `scale(${pressed ? 0.86 : 1})`,
          transformOrigin: `${TIP.x}px ${TIP.y}px`,
          filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.55))",
        }}
      >
        <path d="M5 3L19 12L12 13L9 20L5 3Z" fill="#F7F7F7" stroke="#0A0A0A" strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** The click that happens at a given landing point, if it has already fired. */
const landingClick = (track: Track, landing: Point): number | undefined => {
  const index = track.points.findIndex((p) => p.at === landing);
  const arrive = index >= 0 ? track.points[index].frame : Infinity;
  return track.clicks.find((c) => c >= arrive);
};
