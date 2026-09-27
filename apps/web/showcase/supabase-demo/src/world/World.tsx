import { interpolate } from "remotion";
import { HEIGHT, PULLBACK, WIDTH } from "../timeline";
import { COLORS, SANS } from "../theme";
import { CLAMP, settle } from "../lib/anim";
import { worldTransform, type Camera } from "../camera/rig";
import type { HookMetrics } from "../camera/hook-metrics";
import { HookPanel } from "../panels/HookPanel";
import { SqlScreen, TableScreen, VectorSqlScreen } from "../screens/database";
import {
  AuthScreen,
  EdgeListScreen,
  EdgeScreen,
  RealtimeScreen,
  StorageScreen,
  VectorDocsScreen,
} from "../screens/platform";
import { Shot } from "./capture-layers";
import { ScreenPanel } from "./ScreenPanel";
import { PANELS, WORLD, center, type PanelId, type Rect } from "./layout";

/**
 * World — the one canvas every panel lives on, under the one camera.
 *
 * Two things are derived from the camera rather than keyed by hand:
 *  - focus: panels the camera isn't on are dimmed in proportion to their
 *    distance from the frame centre, and every panel is lit once the camera is
 *    pulled out far enough to see the platform;
 *  - culling: a panel whose rect is off screen keeps its chrome but skips its
 *    capture layers, so only the screens in view decode their images.
 *
 * v2: every panel but the hook is a real dashboard capture (see screens/).
 */

const viewport = (camera: Camera): Rect => {
  const w = WIDTH / camera.s;
  const h = HEIGHT / camera.s;
  return { x: camera.x - w / 2, y: camera.y - h / 2, w, h };
};

const intersects = (a: Rect, b: Rect, margin: number) =>
  a.x < b.x + b.w + margin && a.x + a.w + margin > b.x && a.y < b.y + b.h + margin && a.y + a.h + margin > b.y;

const distanceToRect = (x: number, y: number, r: Rect) => {
  const dx = Math.max(r.x - x, 0, x - (r.x + r.w));
  const dy = Math.max(r.y - y, 0, y - (r.y + r.h));
  return Math.hypot(dx, dy);
};

const focusDim = (camera: Camera, rect: Rect): number => {
  const far = interpolate(distanceToRect(camera.x, camera.y, rect), [0, 520], [0, 0.66], CLAMP);
  const zoomed = interpolate(camera.s, [0.42, 0.62], [0, 1], CLAMP);
  return far * zoomed;
};

/* ------------------------------------------------- pull-back labels */

const LABELS: Array<{ id: PanelId; label: string }> = [
  { id: "table", label: "Database" },
  { id: "auth", label: "Auth" },
  { id: "realtime", label: "Realtime" },
  { id: "storage", label: "Storage" },
  { id: "edge", label: "Edge Functions" },
  { id: "vector", label: "Vector" },
];

const PlatformLabels: React.FC<{ frame: number }> = ({ frame }) => {
  const out = interpolate(frame, [PULLBACK.labelsOut, PULLBACK.labelsOut + 10], [1, 0], CLAMP);
  if (frame < PULLBACK.labelsIn || out <= 0) {
    return null;
  }
  return (
    <>
      {LABELS.map(({ id, label }, i) => {
        const c = center(PANELS[id]);
        const p = settle(frame, PULLBACK.labelsIn + i * 3, 14);
        return (
          <div
            key={id}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              transform: `translate(-50%, -50%) scale(${0.85 + 0.15 * p})`,
              opacity: p * out,
              display: "flex",
              alignItems: "center",
              gap: 48,
              padding: "44px 92px",
              borderRadius: 999,
              background: "rgba(18,18,18,0.92)",
              border: `8px solid ${COLORS.greenLine}`,
              boxShadow: "0 30px 90px rgba(0,0,0,0.6)",
              fontFamily: SANS,
              fontSize: 170,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: COLORS.text,
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 999, background: COLORS.green, boxShadow: "0 0 60px rgba(62,207,142,0.8)" }} />
            {label}
          </div>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------ world */

type WorldProps = { frame: number; camera: Camera; metrics: HookMetrics };

/** Screens that never change: they fill out the world for the pull-back. */
const STATIC: Array<{ id: PanelId; shot: "messages" | "schema" }> = [
  { id: "messages", shot: "messages" },
  { id: "schema", shot: "schema" },
];

export const World: React.FC<WorldProps> = ({ frame, camera, metrics }) => {
  const view = viewport(camera);
  const state = (id: PanelId) => ({
    dim: Math.max(focusDim(camera, PANELS[id]), labelDim(frame)),
    visible: intersects(view, PANELS[id], 80),
  });
  const screen = (id: PanelId, body: React.ReactNode) => (
    <ScreenPanel key={id} id={id} {...state(id)}>
      {body}
    </ScreenPanel>
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: WORLD.w,
        height: WORLD.h,
        transformOrigin: "0 0",
        transform: worldTransform(camera),
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -6000,
          top: -5000,
          width: WORLD.w + 12000,
          height: WORLD.h + 10000,
          backgroundColor: COLORS.world,
          backgroundImage: "radial-gradient(circle, #242424 2.4px, rgba(0,0,0,0) 3px)",
          backgroundSize: "64px 64px",
          backgroundPosition: "32px 32px",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -1400,
          top: -1400,
          width: WORLD.w + 2800,
          height: WORLD.h + 2800,
          background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(62,207,142,0.07), rgba(0,0,0,0) 70%)",
        }}
      />
      <HookPanel frame={frame} metrics={metrics} {...state("hook")} />
      {screen("table", <TableScreen frame={frame} />)}
      {screen("sql", <SqlScreen frame={frame} />)}
      {screen("auth", <AuthScreen frame={frame} />)}
      {screen("realtime", <RealtimeScreen frame={frame} />)}
      {screen("storage", <StorageScreen frame={frame} />)}
      {screen("edgeList", <EdgeListScreen frame={frame} />)}
      {screen("edge", <EdgeScreen frame={frame} />)}
      {screen("vector", <VectorDocsScreen frame={frame} />)}
      {screen("vectorSql", <VectorSqlScreen frame={frame} />)}
      {STATIC.map(({ id, shot }) => screen(id, <Shot id={shot} />))}
      <PlatformLabels frame={frame} />
    </div>
  );
};

/** Panels step back slightly while the pull-back labels are up. */
const labelDim = (frame: number): number =>
  0.35 *
  interpolate(frame, [PULLBACK.labelsIn, PULLBACK.labelsIn + 12], [0, 1], CLAMP) *
  interpolate(frame, [PULLBACK.labelsOut, PULLBACK.labelsOut + 10], [1, 0], CLAMP);
