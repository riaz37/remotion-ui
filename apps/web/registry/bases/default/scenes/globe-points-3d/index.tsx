import { Environment, Instance, Instances, Lightformer } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  Color,
  Euler,
  Float32BufferAttribute,
  QuadraticBezierCurve3,
  Quaternion,
  TubeGeometry,
  Vector3,
} from "three";

export type GlobePoint3D = {
  /** Degrees north. */
  lat: number;
  /** Degrees east. */
  lng: number;
};

export type GlobeRoute3D = {
  from: GlobePoint3D;
  to: GlobePoint3D;
  /** Overrides `arcColor` for this one route. */
  color?: string;
};

export type GlobePoints3dProps = {
  /** Marker pins on the sphere. Defaults to the route endpoints' cities. */
  points?: GlobePoint3D[];
  /** Arcs drawn between lat/lon pairs, revealed in order. */
  routes?: GlobeRoute3D[];
  /** Degrees of longitude the globe turns per second. */
  spinPerSecond?: number;
  /** Longitude facing the camera at frame 0. */
  startLongitude?: number;
  /** Axial tilt in degrees; positive leans the north pole toward the camera. */
  tilt?: number;
  /** Outer backdrop color. */
  backgroundColor?: string;
  /** Ocean / sphere body color. */
  globeColor?: string;
  /** Procedural landmass dots. */
  landColor?: string;
  /** City pins and their ping rings. */
  markerColor?: string;
  /** Default arc color. */
  arcColor?: string;
  /** Cool rim light raking the limb. */
  rimColor?: string;
  /** Warm key light. */
  accentColor?: string;
  /** Fresnel halo around the limb. */
  atmosphereColor?: string;
};

// ------------------------------------------------------------------ constants

const DEG = Math.PI / 180;
const RADIUS = 2;
/** Dots sit just off the surface so they never z-fight with the sphere. */
const LAND_LIFT = 1.004;
const RING_LIFT = 1.009;
const LAND_SAMPLES = 3600;
const STAR_COUNT = 260;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const IN_OUT = Easing.inOut(Easing.cubic);

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
/** Positive modulo: a plain `%` returns negative before the first cycle. */
const wrap = (value: number, span: number) => ((value % span) + span) % span;

type Vec3 = [number, number, number];

const DEFAULT_ROUTES: GlobeRoute3D[] = [
  { from: { lat: 40.7, lng: -74 }, to: { lat: 51.5, lng: -0.1 } },
  { from: { lat: 51.5, lng: -0.1 }, to: { lat: 25.2, lng: 55.3 } },
  { from: { lat: 25.2, lng: 55.3 }, to: { lat: 1.35, lng: 103.8 } },
  { from: { lat: 37.77, lng: -122.4 }, to: { lat: 35.7, lng: 139.7 } },
  { from: { lat: 40.7, lng: -74 }, to: { lat: -23.5, lng: -46.6 } },
  { from: { lat: 52.5, lng: 13.4 }, to: { lat: -33.9, lng: 18.4 } },
];

const DEFAULT_POINTS: GlobePoint3D[] = [
  { lat: 40.7, lng: -74 },
  { lat: 51.5, lng: -0.1 },
  { lat: 25.2, lng: 55.3 },
  { lat: 1.35, lng: 103.8 },
  { lat: 37.77, lng: -122.4 },
  { lat: 35.7, lng: 139.7 },
  { lat: -23.5, lng: -46.6 },
  { lat: 52.5, lng: 13.4 },
  { lat: -33.9, lng: 18.4 },
  { lat: -33.9, lng: 151.2 },
];

// ------------------------------------------------------------------- geometry

/** Longitude 0 faces +Z, i.e. the camera, before the globe spins. */
const toVector = (lat: number, lng: number, radius: number): Vector3 => {
  const p = lat * DEG;
  const l = lng * DEG;
  return new Vector3(
    radius * Math.cos(p) * Math.sin(l),
    radius * Math.sin(p),
    radius * Math.cos(p) * Math.cos(l),
  );
};

const UP = new Vector3(0, 1, 0);
const FORWARD = new Vector3(0, 0, 1);

/** Euler that points a mesh's local axis along the surface normal. */
const alignTo = (normal: Vector3, axis: Vector3): Vec3 => {
  const quaternion = new Quaternion().setFromUnitVectors(axis, normal);
  const euler = new Euler().setFromQuaternion(quaternion);
  return [euler.x, euler.y, euler.z];
};

// ---------------------------------------------------------------------- noise

/**
 * Seeded value noise. The landmasses are generated rather than fetched: an
 * earth texture would mean a CDN round trip (or a large binary in the repo) on
 * every render, and this scene is an abstract data globe, not a map.
 */
const hash = (x: number, y: number, z: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
};

const smootherstep = (t: number) => t * t * (3 - 2 * t);

const valueNoise = (x: number, y: number, z: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = smootherstep(x - xi);
  const yf = smootherstep(y - yi);
  const zf = smootherstep(z - zi);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const corner = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz);

  const x00 = lerp(corner(0, 0, 0), corner(1, 0, 0), xf);
  const x10 = lerp(corner(0, 1, 0), corner(1, 1, 0), xf);
  const x01 = lerp(corner(0, 0, 1), corner(1, 0, 1), xf);
  const x11 = lerp(corner(0, 1, 1), corner(1, 1, 1), xf);

  return lerp(lerp(x00, x10, yf), lerp(x01, x11, yf), zf);
};

const fbm = (v: Vector3) => {
  let sum = 0;
  let amplitude = 0.5;
  let frequency = 1.4;
  for (let octave = 0; octave < 4; octave += 1) {
    sum += amplitude * valueNoise(v.x * frequency, v.y * frequency, v.z * frequency);
    frequency *= 2.1;
    amplitude *= 0.5;
  }
  return sum / 0.9375;
};

type LandDot = { position: Vec3; scale: number; phase: number };

/**
 * Fibonacci sphere, thresholded by fbm so the kept dots clump into continents
 * instead of covering the ball evenly. `phase` drives the assembly sweep.
 */
const buildLand = (): LandDot[] => {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const dots: LandDot[] = [];

  for (let i = 0; i < LAND_SAMPLES; i += 1) {
    const y = 1 - (i / (LAND_SAMPLES - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * golden;
    const unit = new Vector3(Math.cos(theta) * ring, y, Math.sin(theta) * ring);

    // Slight northern bias: most of the default cities sit in the northern
    // mid-latitudes and land under them reads better than open water.
    const bias = 0.05 * Math.exp(-(((y - 0.55) / 0.5) ** 2));
    if (fbm(unit) < 0.49 - bias) continue;

    dots.push({
      position: [unit.x * RADIUS * LAND_LIFT, unit.y * RADIUS * LAND_LIFT, unit.z * RADIUS * LAND_LIFT],
      // Small and even: larger dots read as loose bubbles stuck to the ball
      // rather than a dot-matrix landmass.
      scale: 0.013 + hash(unit.x, unit.z, unit.y) * 0.006,
      // Sweeps pole to pole, so the globe knits itself together top-down.
      phase: (1 - y) / 2,
    });
  }

  return dots;
};

const buildStars = (): Float32Array => {
  const positions = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i += 1) {
    const u = hash(i * 1.3, 9.1, 2.7);
    const v = hash(i * 0.7, 4.4, 8.3);
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const radius = 16 + hash(i * 2.1, 1.1, 5.5) * 8;
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  return positions;
};

// ----------------------------------------------------------------- atmosphere

const ATMOSPHERE_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-viewPosition.xyz);
  gl_Position = projectionMatrix * viewPosition;
}`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  // Back faces, so the rim is where the normal turns away from the eye.
  float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 3.0);
  gl_FragColor = vec4(uColor * fresnel, fresnel);
  #include <colorspace_fragment>
}`;

// ----------------------------------------------------------------------- arcs

const ARC_VERTEX = /* glsl */ `
varying vec2 vArcUv;
void main() {
  vArcUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/**
 * Reveal lives in the fragment shader, not in regenerated geometry: the tube is
 * built once and the head/tail are frame-driven uniforms, so every frame is
 * reproducible from its own number. A drei <Trail> would accumulate across real
 * draw calls and never reproduce under a non-sequential render.
 */
const ARC_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uHead;
uniform float uTail;
varying vec2 vArcUv;
void main() {
  float t = vArcUv.x;
  if (t > uHead || t < uTail) discard;
  float lead = smoothstep(uHead - 0.12, uHead, t);
  float fade = smoothstep(uTail, uTail + 0.06, t);
  vec3 color = uColor * (0.55 + lead * 1.9);
  gl_FragColor = vec4(color * fade, fade);
  #include <colorspace_fragment>
}`;

type ArcProps = { from: GlobePoint3D; to: GlobePoint3D; color: string; head: number; tail: number };

const Arc: React.FC<ArcProps> = ({ from, to, color, head, tail }) => {
  const geometry = useMemo(() => {
    const a = toVector(from.lat, from.lng, RADIUS);
    const b = toVector(to.lat, to.lng, RADIUS);
    // Lift scales with the gap, so a short hop stays low and a long haul
    // arches well clear of the limb.
    const spread = a.angleTo(b) / Math.PI;
    const mid = a.clone().add(b).normalize().multiplyScalar(RADIUS * (1 + 0.28 + spread * 0.75));
    const curve = new QuadraticBezierCurve3(a, mid, b);
    return new TubeGeometry(curve, 96, 0.016, 10, false);
  }, [from.lat, from.lng, to.lat, to.lng]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  // Hoisted above the early return: a hook inside the JSX below would change
  // hook order on the frames where the arc is not drawn.
  const tint = useMemo(() => new Color(color), [color]);
  const uniforms = useMemo(
    () => ({ uColor: { value: new Color(color) }, uHead: { value: 0 }, uTail: { value: 0 } }),
    // Rebuilt only on color change; head/tail arrive as pierced props below.
    [color],
  );

  if (head <= 0 || tail >= 1) return null;

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        vertexShader={ARC_VERTEX}
        fragmentShader={ARC_FRAGMENT}
        uniforms={uniforms}
        uniforms-uColor-value={tint}
        uniforms-uHead-value={head}
        uniforms-uTail-value={tail}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
};

// --------------------------------------------------------------------- camera

const CameraRig: React.FC<{ position: Vec3 }> = ({ position }) => {
  const camera = useThree((state) => state.camera);
  const [x, y, z] = position;
  useLayoutEffect(() => {
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
  }, [camera, x, y, z]);
  return null;
};

// ----------------------------------------------------------------------- shot

/**
 * Every value is a pure function of the frame and self-paces off the clip
 * length. The spin and a linear drift never settle, so the last frame is still
 * moving however long the composition is.
 */
const useShot = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const last = Math.max(2, durationInFrames - 1);

  const drift = interpolate(frame, [0, last], [0, 1], clamp);
  const settle = interpolate(frame, [0, last * 0.45], [0, 1], { ...clamp, easing: EASE_OUT });
  // Runs past 1 so the trailing dots finish their own reveal ramp.
  const assemble = interpolate(frame, [0, last * 0.3], [0, 1.35], { ...clamp, easing: IN_OUT });

  return {
    frame,
    fps,
    last,
    assemble,
    markerStart: last * 0.15,
    arcStart: last * 0.1,
    // Far enough back that the limb never touches the top and bottom edges.
    camera: [0, interpolate(settle, [0, 1], [2.9, 0.65]), 10.2 - settle * 1.0 - drift * 0.5] as Vec3,
  };
};

// ---------------------------------------------------------------------- scene

export const GlobePoints3d: React.FC<GlobePoints3dProps> = ({
  points = DEFAULT_POINTS,
  routes = DEFAULT_ROUTES,
  spinPerSecond = 15,
  startLongitude = -30,
  tilt = 20,
  backgroundColor = "#04060d",
  globeColor = "#16305c",
  landColor = "#5fd0e8",
  markerColor = "#7dd3e8",
  arcColor = "#e8b86d",
  rimColor = "#6ea8ff",
  accentColor = "#ffb27a",
  atmosphereColor = "#4f8fd6",
}) => {
  const { width, height } = useVideoConfig();
  const shot = useShot();

  const land = useMemo(() => buildLand(), []);
  const stars = useMemo(() => buildStars(), []);
  const starGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(stars, 3));
    return geometry;
  }, [stars]);
  useEffect(() => () => starGeometry.dispose(), [starGeometry]);

  // A vec3 uniform needs a Color; a CSS string silently leaves it unset.
  const atmosphereTint = useMemo(() => new Color(atmosphereColor), [atmosphereColor]);
  const atmosphereUniforms = useMemo(
    () => ({ uColor: { value: new Color(atmosphereColor) } }),
    [atmosphereColor],
  );

  /** Static per-marker placement; only the scale is frame-driven. */
  const markers = useMemo(
    () =>
      points.map((point) => {
        const normal = toVector(point.lat, point.lng, 1);
        return {
          pin: normal.clone().multiplyScalar(RADIUS + 0.058).toArray() as Vec3,
          ring: normal.clone().multiplyScalar(RADIUS * RING_LIFT).toArray() as Vec3,
          pinRotation: alignTo(normal, UP),
          ringRotation: alignTo(normal, FORWARD),
        };
      }),
    [points],
  );

  const spin = (startLongitude + (shot.frame / shot.fps) * spinPerSecond) * DEG;

  // Arc timeline: travel, hold, then the tail catches the head and the route
  // fires again. Staggered so something is always in flight.
  const travel = Math.max(6, shot.last * 0.3);
  const hold = Math.max(3, shot.last * 0.14);
  const cycle = travel * 2 + hold + Math.max(4, shot.last * 0.1);
  const stagger = shot.last * 0.09;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 45%, #0b1226 0%, ${backgroundColor} 70%)`,
      }}
    >
      <ThreeCanvas width={width} height={height} camera={{ position: shot.camera, fov: 32 }}>
        <CameraRig position={shot.camera} />

        {/* Built from Lightformers: a preset would fetch an HDRI from a CDN. */}
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={2.2} position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[10, 6, 1]} />
          <Lightformer intensity={5} position={[-5, 1.5, -3]} rotation-y={1.3} scale={[7, 5, 1]} color={rimColor} />
          <Lightformer intensity={2.4} position={[5, 2, 2]} rotation-y={-1.1} scale={[6, 4, 1]} color={accentColor} />
        </Environment>
        <ambientLight intensity={0.5} />
        {/* Key sits beside the camera: lit from behind only, the whole front
            hemisphere goes muddy and the scene reads as an unlit render. */}
        <directionalLight position={[-3.5, 2.6, 7]} intensity={2.4} color="#e8f0ff" />
        {/* Warm fill, kept low so it tints the terminator instead of staining
            the front of the globe brown. */}
        <directionalLight position={[4.5, 1.2, 3.5]} intensity={0.7} color={accentColor} />
        {/* Rim from behind: the crescent the intent asks for. */}
        <directionalLight position={[5.5, 1.5, -5]} intensity={3.4} color={rimColor} />

        <points geometry={starGeometry}>
          <pointsMaterial size={0.06} color="#9fb6d8" sizeAttenuation transparent opacity={0.55} />
        </points>

        <group rotation={[tilt * DEG * 0.35, 0, -tilt * DEG]}>
          <group rotation-y={spin}>
            {/* Opaque sphere: it is what hides the far-side markers and arcs.
                The occlusion is depth-tested geometry, never a hand-faded
                front-hemisphere test like the flat globe-arc projection. */}
            <mesh>
              <sphereGeometry args={[RADIUS, 96, 96]} />
              <meshStandardMaterial color={globeColor} roughness={0.62} metalness={0.15} envMapIntensity={0.8} />
            </mesh>

            <Instances limit={land.length} range={land.length}>
              <sphereGeometry args={[1, 6, 6]} />
              <meshStandardMaterial
                color={landColor}
                roughness={0.85}
                metalness={0}
                emissive={landColor}
                emissiveIntensity={0.22}
              />
              {land.map((dot, index) => {
                const reveal = clamp01((shot.assemble - dot.phase) / 0.22);
                if (reveal <= 0) return null;
                return (
                  <Instance
                    key={index}
                    position={dot.position}
                    // Overshoot on arrival, so dots pop rather than fade in.
                    scale={dot.scale * interpolate(reveal, [0, 0.7, 1], [0, 1.5, 1])}
                  />
                );
              })}
            </Instances>

            {/* Pins */}
            <Instances limit={markers.length} range={markers.length}>
              <coneGeometry args={[0.03, 0.13, 12]} />
              {/* Emissive kept low: at 1.4 the pins clipped to flat white and
                  read as paper arrowheads instead of lit markers. */}
              <meshStandardMaterial
                color={markerColor}
                emissive={markerColor}
                emissiveIntensity={0.85}
                roughness={0.35}
              />
              {markers.map((marker, index) => {
                const reveal = clamp01((shot.frame - shot.markerStart - index * 3) / 10);
                if (reveal <= 0) return null;
                return (
                  <Instance
                    key={index}
                    position={marker.pin}
                    rotation={marker.pinRotation}
                    scale={interpolate(reveal, [0, 0.65, 1], [0, 1.35, 1])}
                  />
                );
              })}
            </Instances>

            {/* Ping rings. Additive, so per-instance color doubles as the fade
                that <Instance> gives no opacity for. */}
            <Instances limit={markers.length} range={markers.length}>
              <ringGeometry args={[0.78, 1, 40]} />
              <meshBasicMaterial
                color="#ffffff"
                transparent
                depthWrite={false}
                blending={AdditiveBlending}
                toneMapped={false}
              />
              {markers.map((marker, index) => {
                const alive = clamp01((shot.frame - shot.markerStart - index * 3) / 10);
                if (alive <= 0) return null;
                const period = 54;
                const p = wrap(shot.frame - index * 7, period) / period;
                // Squared falloff: a linear fade left the ring legible for most
                // of its travel and it read as a grey band, not a ping.
                const level = (1 - p) ** 1.7 * alive;
                const channel = Math.round(level * 255);
                return (
                  <Instance
                    key={index}
                    position={marker.ring}
                    rotation={marker.ringRotation}
                    scale={0.045 + p * 0.12}
                    color={`rgb(${Math.round(channel * 0.49)}, ${Math.round(channel * 0.83)}, ${channel})`}
                  />
                );
              })}
            </Instances>

            {routes.map((route, index) => {
              const local = shot.frame - shot.arcStart - index * stagger;
              if (local < 0) return null;
              const phase = wrap(local, cycle);
              return (
                <Arc
                  key={`${route.from.lat},${route.from.lng}-${route.to.lat},${route.to.lng}-${index}`}
                  from={route.from}
                  to={route.to}
                  color={route.color ?? arcColor}
                  head={clamp01(phase / travel)}
                  tail={clamp01((phase - travel - hold) / travel)}
                />
              );
            })}
          </group>

          {/* Halo. Back faces only, so it reads as atmosphere around the limb
              rather than a veil over the front of the globe. */}
          <mesh scale={1.06}>
            <sphereGeometry args={[RADIUS, 64, 64]} />
            <shaderMaterial
              uniforms={atmosphereUniforms}
              uniforms-uColor-value={atmosphereTint}
              vertexShader={ATMOSPHERE_VERTEX}
              fragmentShader={ATMOSPHERE_FRAGMENT}
              transparent
              depthWrite={false}
              side={BackSide}
              blending={AdditiveBlending}
            />
          </mesh>
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
