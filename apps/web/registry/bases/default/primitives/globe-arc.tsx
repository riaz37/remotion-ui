import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";

export type GlobePoint = {
  /** Degrees east. */
  lng: number;
  /** Degrees north. */
  lat: number;
  label?: string;
};

export type GlobeArcRoute = {
  from: GlobePoint;
  to: GlobePoint;
  color?: string;
  /** Second, relative to `delayInFrames`, that this arc starts drawing. */
  delayInFrames?: number;
};

export type GlobeArcProps = {
  routes?: GlobeArcRoute[];
  size?: number;
  /** Degrees of longitude the globe turns per second. */
  spinPerSecond?: number;
  /** Longitude facing the viewer at frame 0. */
  startLongitude?: number;
  /** Latitude the camera sits at. Positive tilts the north pole toward you. */
  tilt?: number;
  /** Frames to wait before the first arc draws. */
  delayInFrames?: number;
  /** Frames one arc takes to draw. */
  durationInFrames?: number;
  /** Frames between arcs, when a route sets no delay of its own. */
  staggerInFrames?: number;
  sphereColor?: string;
  graticuleColor?: string;
  arcColor?: string;
  cityColor?: string;
  /** Frame the globe starts leaving. Omit to leave it on screen. */
  exitAtInFrames?: number;
  /** Frames the exit takes. */
  exitInFrames?: number;
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const RADIUS = 100;
const DEG = Math.PI / 180;

const DEFAULT_ROUTES: GlobeArcRoute[] = [
  { from: { lng: -74, lat: 40.7, label: "NYC" }, to: { lng: -0.1, lat: 51.5, label: "London" } },
  { from: { lng: -0.1, lat: 51.5 }, to: { lng: 8.5, lat: 47.4, label: "Zurich" } },
  { from: { lng: -74, lat: 40.7 }, to: { lng: -46.6, lat: -23.5, label: "São Paulo" } },
  { from: { lng: 8.5, lat: 47.4 }, to: { lng: 18.4, lat: -33.9, label: "Cape Town" } },
];

type Projected = { x: number; y: number; visible: boolean };

/**
 * Orthographic projection — what a globe actually looks like from far away.
 *
 * The `visible` flag is the front-hemisphere test: without it, points on the
 * far side project onto the near side and arcs fold back across the disc, which
 * is the single thing that makes a hand-rolled globe look wrong.
 */
const project = (lng: number, lat: number, spin: number, tilt: number): Projected => {
  const l = (lng - spin) * DEG;
  const p = lat * DEG;
  const t = tilt * DEG;
  const cosC = Math.sin(t) * Math.sin(p) + Math.cos(t) * Math.cos(p) * Math.cos(l);
  return {
    x: RADIUS * Math.cos(p) * Math.sin(l),
    y: -RADIUS * (Math.cos(t) * Math.sin(p) - Math.sin(t) * Math.cos(p) * Math.cos(l)),
    visible: cosC > 0,
  };
};

/** Points along the great circle between two coordinates, as a slerp. */
const greatCircle = (from: GlobePoint, to: GlobePoint, samples: number) => {
  const toVector = (point: GlobePoint) => {
    const l = point.lng * DEG;
    const p = point.lat * DEG;
    return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
  };
  const a = toVector(from);
  const b = toVector(to);
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);

  return Array.from({ length: samples + 1 }, (_, index) => {
    const t = index / samples;
    // Two coincident points give omega 0 and a division by zero; falling back
    // to a plain lerp keeps a degenerate route from producing NaN geometry.
    const [wa, wb] =
      omega < 1e-6
        ? [1 - t, t]
        : [Math.sin((1 - t) * omega) / Math.sin(omega), Math.sin(t * omega) / Math.sin(omega)];
    const x = a[0] * wa + b[0] * wb;
    const y = a[1] * wa + b[1] * wb;
    const z = a[2] * wa + b[2] * wb;
    return {
      lng: Math.atan2(y, x) / DEG,
      lat: Math.asin(Math.min(1, Math.max(-1, z / Math.hypot(x, y, z)))) / DEG,
    };
  });
};

/**
 * Turns a run of projected samples into path segments, breaking wherever the
 * line goes round the back. One `d` string with a `M` at every re-entry keeps a
 * route that crosses the horizon twice in a single element.
 */
const toPath = (points: Projected[]) => {
  const segments: string[] = [];
  let open = false;
  for (const point of points) {
    if (!point.visible) {
      open = false;
      continue;
    }
    segments.push(`${open ? "L" : "M"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`);
    open = true;
  }
  return segments.join(" ");
};

/**
 * Arcs between points on a spinning globe.
 *
 * The globe is projected arithmetically rather than drawn from map tiles, so it
 * has no network dependency and no `delayRender` — every frame is a pure
 * function of its own number, which is what a render farm wants.
 *
 * Arcs are great circles sampled and clipped to the front hemisphere, so a
 * route bends the way a flight path does and disappears round the limb instead
 * of sliding across the disc.
 */
export const GlobeArc: React.FC<GlobeArcProps> = ({
  routes = DEFAULT_ROUTES,
  size = 420,
  spinPerSecond = 14,
  startLongitude = -40,
  tilt = 18,
  delayInFrames = 6,
  durationInFrames = 34,
  staggerInFrames = 16,
  sphereColor = "#0E1524",
  graticuleColor = "rgba(125,211,232,0.22)",
  arcColor = "#E8B86D",
  cityColor = "#7DD3E8",
  exitAtInFrames,
  exitInFrames = 16,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spin = startLongitude + (frame / fps) * spinPerSecond;

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const meridians = Array.from({ length: 12 }, (_, index) =>
    toPath(
      Array.from({ length: 49 }, (_, step) =>
        project(index * 30, -90 + step * 3.75, spin, tilt),
      ),
    ),
  );
  const parallels = [-60, -30, 0, 30, 60].map((lat) =>
    toPath(
      Array.from({ length: 97 }, (_, step) => project(-180 + step * 3.75, lat, spin, tilt)),
    ),
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="-115 -115 230 230"
      style={{ overflow: "visible", opacity: 1 - exit }}
    >
      <defs>
        <radialGradient id="globe-arc-shade" cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
          <stop offset="62%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </radialGradient>
      </defs>

      <circle cx={0} cy={0} r={RADIUS} fill={sphereColor} />

      {[...meridians, ...parallels].map((d, index) =>
        d ? (
          <path
            key={index}
            d={d}
            fill="none"
            stroke={graticuleColor}
            strokeWidth={0.7}
            strokeLinecap="round"
          />
        ) : null,
      )}

      {/* Shading sits above the graticule and below the arcs: it is the globe's
          curvature, so it should dim the grid and not the data. */}
      <circle cx={0} cy={0} r={RADIUS} fill="url(#globe-arc-shade)" />
      <circle
        cx={0}
        cy={0}
        r={RADIUS}
        fill="none"
        stroke={graticuleColor}
        strokeWidth={1.1}
      />

      {routes.map((route, index) => {
        const start = delayInFrames + (route.delayInFrames ?? index * staggerInFrames);
        const draw = interpolate(frame, [start, start + durationInFrames], [0, 1], {
          easing: EASING.editorial,
          ...clamp,
        });
        if (draw <= 0) return null;

        const samples = greatCircle(route.from, route.to, 64);
        const drawn = samples.slice(0, Math.max(2, Math.ceil(samples.length * draw)));
        const projected = drawn.map((point) => project(point.lng, point.lat, spin, tilt));
        const d = toPath(projected);
        const color = route.color ?? arcColor;
        const head = projected[projected.length - 1];

        return (
          <g key={`${route.from.lng},${route.from.lat}-${index}`}>
            {d ? (
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
                opacity={0.95}
              />
            ) : null}
            {head?.visible && draw < 1 ? (
              <circle cx={head.x} cy={head.y} r={2.6} fill={color} />
            ) : null}

            {[route.from, route.to].map((city, cityIndex) => {
              const point = project(city.lng, city.lat, spin, tilt);
              if (!point.visible || !city.label) return null;
              // The origin exists from the first frame; the destination only
              // once the arc has arrived, so a label never precedes its route.
              const shown = cityIndex === 0 ? draw > 0 : draw >= 1;
              if (!shown) return null;
              return (
                <g key={city.label}>
                  <circle cx={point.x} cy={point.y} r={2.4} fill={cityColor} />
                  <text
                    x={point.x + 5}
                    // Alternating side: two cities close together on the globe
                    // — London and Zurich at this scale — would otherwise set
                    // their labels on top of each other.
                    y={point.y + (index % 2 === 0 ? -4 : 10)}
                    fill={cityColor}
                    fontSize={7}
                    fontWeight={600}
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                  >
                    {city.label}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};
