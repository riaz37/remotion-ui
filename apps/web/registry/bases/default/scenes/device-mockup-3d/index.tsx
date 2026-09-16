import { ContactShadows, Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import {
  AdditiveBlending,
  Color,
  Float32BufferAttribute,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
} from "three";

/**
 * Hosted rather than `staticFile()`: a freshly installed project has no
 * `public/launch-film/`, and a missing screen fails the whole render. Pass your
 * own `src` — `staticFile("app.png")` or any CORS-enabled URL.
 */
const DEFAULT_SCREEN_SRC = "https://remotionui.com/launch-film/04-preview-ready.png";
const DEFAULT_ASPECT = 2880 / 1744;

export type DeviceMockup3DProps = {
  /** Screenshot shown on the screen. Bright UI reads best; a dark image reads as a black slab. */
  src?: string;
  /** Screen width / height. Omit to use the image's own ratio. */
  screenAspect?: number;
  /** Outer backdrop color. */
  backgroundColor?: string;
  /** Soft glow behind the device. */
  glowColor?: string;
  /** Lit floor pool the contact shadow falls on. Keep it lighter than the backdrop. */
  floorColor?: string;
  /** Aluminium body color. */
  bodyColor?: string;
  /** Cool rim light from the left. */
  rimColor?: string;
  /** Warm accent light from the right. */
  accentColor?: string;
  /** Strength of the glass reflection over the screen, 0–1. */
  glare?: number;
};

// ------------------------------------------------------------------- geometry

const SCREEN_W = 3.0;
const BEZEL_SIDE = 0.075;
const BEZEL_TOP = 0.1;
const BEZEL_CHIN = 0.15;
const LID_T = 0.045;
const BASE_T = 0.075;
const LID_OPEN = -0.32;
const LID_CLOSED = Math.PI / 2 - 0.01;
/** Lifts the hinge so a closed lid clears the key tops. */
const KEY_CLEARANCE = 0.014;

type Vec3 = [number, number, number];

/** Rounded rectangle with UVs spanning 0–1, so a texture maps edge to edge. */
const roundedRect = (w: number, h: number, r: number): ShapeGeometry => {
  const x = -w / 2;
  const y = -h / 2;
  const shape = new Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(x + w, y + h - r);
  shape.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  shape.lineTo(x + r, y + h);
  shape.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + r);
  shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);

  const geometry = new ShapeGeometry(shape, 10);
  const position = geometry.attributes.position;
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = (position.getX(i) - x) / w;
    uv[i * 2 + 1] = (position.getY(i) - y) / h;
  }
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  return geometry;
};

const useRoundedRect = (w: number, h: number, r: number): ShapeGeometry => {
  const geometry = useMemo(() => roundedRect(w, h, r), [w, h, r]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
};

// -------------------------------------------------------------------- texture

/**
 * Fetched into a same-origin blob URL before it reaches TextureLoader. A
 * cross-origin <img> that WebGL refuses to upload does not throw — three logs
 * the SecurityError and the screen renders black while the render exits 0. A
 * blob URL can never taint the context, and a CORS or network failure now
 * fails the render loudly instead.
 */
const loadScreenTexture = async (src: string, signal: AbortSignal): Promise<Texture> => {
  const response = await fetch(src, { signal });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const objectUrl = URL.createObjectURL(await response.blob());
  try {
    const texture = await new TextureLoader().loadAsync(objectUrl);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

type ScreenTexture = {
  texture: Texture | null;
  /** Releases the delayRender hold. Call only once the texture has been drawn. */
  release: () => void;
};

/**
 * Loaded by hand behind delayRender: drei's useTexture suspends, and a
 * suspended frame can be captured before the screen texture exists.
 *
 * The hold is NOT released when the image arrives. During a render
 * ThreeCanvas draws only when the frame changes, so a texture that lands
 * after that draw is never shown — releasing on load let a slow (remote)
 * image screenshot as a black screen with exit 0. `<ScreenReady>` releases
 * it after the texture is committed and a frame has been drawn with it.
 */
const useScreenTexture = (src: string): ScreenTexture => {
  const [texture, setTexture] = useState<Texture | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const pending = useRef<number | null>(null);

  const release = useCallback(() => {
    const handle = pending.current;
    if (handle === null) return;
    pending.current = null;
    continueRender(handle);
  }, [continueRender]);

  useEffect(() => {
    pending.current = delayRender(`Loading device screen: ${src}`);
    const controller = new AbortController();
    let active = true;
    let loaded: Texture | null = null;

    loadScreenTexture(src, controller.signal).then(
      (result) => {
        if (!active) {
          result.dispose();
          return;
        }
        loaded = result;
        setTexture(result);
      },
      (error: unknown) => {
        if (!active) return;
        const reason = error instanceof Error ? error.message : String(error);
        cancelRender(
          new Error(
            `DeviceMockup3D: could not load screen image "${src}" (${reason}). Use staticFile() or a CORS-enabled URL.`,
          ),
        );
      },
    );

    return () => {
      active = false;
      controller.abort();
      release();
      loaded?.dispose();
    };
  }, [src, delayRender, cancelRender, release]);

  return { texture, release };
};

/** Lives inside the canvas: draws a frame with the new texture, then lets the render continue. */
const ScreenReady: React.FC<{ texture: Texture | null; onReady: () => void }> = ({ texture, onReady }) => {
  const advance = useThree((state) => state.advance);

  useEffect(() => {
    if (!texture) return;
    // Draw one frame now, whatever the frameloop. In a render the canvas only
    // draws on frame changes; in the Player this is one extra, harmless draw.
    advance(performance.now());
    onReady();
  }, [texture, advance, onReady]);

  return null;
};

// ---------------------------------------------------------------------- floor

const FLOOR_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FLOOR_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
varying vec2 vUv;
void main() {
  float d = distance(vUv, vec2(0.5)) * 2.0;
  float a = 1.0 - smoothstep(0.0, 1.0, d);
  gl_FragColor = vec4(uColor, a * a);
  #include <colorspace_fragment>
}`;

/** A lit pool on the floor. Dark shadow on a dark backdrop is invisible; on the pool it reads. */
const FloorPool: React.FC<{ color: string }> = ({ color }) => {
  const uniforms = useMemo(() => ({ uColor: { value: new Color(color) } }), [color]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.002, 0]}>
      <planeGeometry args={[9, 9]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={FLOOR_VERTEX}
        fragmentShader={FLOOR_FRAGMENT}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};

// --------------------------------------------------------------------- laptop

type LaptopProps = {
  texture: Texture | null;
  aspect: number;
  bodyColor: string;
  glare: number;
  lidAngle: number;
};

/** Bottom-row key widths in key units; the wide one is the space bar. */
const BOTTOM_ROW = [1, 1, 1, 6, 1, 1, 1, 1];
const KEY_COLUMNS = 13;
const KEY_ROWS = 4;

const Keyboard: React.FC<{ width: number; startZ: number }> = ({ width, startZ }) => {
  const pitch = width / KEY_COLUMNS;
  const gap = pitch * 0.14;
  const fullRows = Array.from({ length: KEY_ROWS }, () =>
    Array.from({ length: KEY_COLUMNS }, (_, col) => ({ col, span: 1 })),
  );
  const bottom = BOTTOM_ROW.map((span, i) => ({
    col: BOTTOM_ROW.slice(0, i).reduce((sum, w) => sum + w, 0),
    span,
  }));
  const rows = [...fullRows, bottom];

  return (
    <group position={[0, BASE_T + 0.006, 0]}>
      {rows.flatMap((row, r) =>
        row.map(({ col, span }) => (
          <mesh
            key={`${r}-${col}`}
            position={[-width / 2 + (col + span / 2) * pitch, 0, startZ + (r + 0.5) * pitch]}
          >
            <boxGeometry args={[span * pitch - gap, 0.012, pitch - gap]} />
            <meshStandardMaterial color="#0e0f12" roughness={0.6} metalness={0.1} />
          </mesh>
        )),
      )}
    </group>
  );
};

const Laptop: React.FC<LaptopProps> = ({ texture, aspect, bodyColor, glare, lidAngle }) => {
  const screenH = SCREEN_W / aspect;
  const lidW = SCREEN_W + BEZEL_SIDE * 2;
  const lidH = screenH + BEZEL_TOP + BEZEL_CHIN;
  const baseW = lidW + 0.06;
  const baseD = lidH * 0.98;
  const keyboardW = baseW * 0.8;
  const keyboardStart = -baseD / 2 + 0.2;

  const glassFront = useRoundedRect(lidW - 0.012, lidH - 0.012, 0.075);
  const screen = useRoundedRect(SCREEN_W, screenH, 0.035);
  const trackpad = useRoundedRect(1.15, 0.64, 0.05);
  const well = useRoundedRect(keyboardW + 0.08, (keyboardW / KEY_COLUMNS) * 5 + 0.08, 0.04);
  const front = LID_T / 2;

  return (
    <group>
      {/* Base */}
      <RoundedBox args={[baseW, BASE_T, baseD]} radius={0.03} smoothness={4} position={[0, BASE_T / 2, 0]}>
        <meshPhysicalMaterial color={bodyColor} metalness={0.85} roughness={0.42} envMapIntensity={1.5} clearcoat={0.3} clearcoatRoughness={0.35} />
      </RoundedBox>
      <mesh geometry={well} rotation-x={-Math.PI / 2} position={[0, BASE_T + 0.001, keyboardStart + ((keyboardW / KEY_COLUMNS) * 5) / 2]}>
        <meshStandardMaterial color="#17191d" roughness={0.8} metalness={0.2} />
      </mesh>
      <Keyboard width={keyboardW} startZ={keyboardStart} />
      <mesh geometry={trackpad} rotation-x={-Math.PI / 2} position={[0, BASE_T + 0.001, baseD / 2 - 0.44]}>
        <meshPhysicalMaterial color={bodyColor} metalness={0.7} roughness={0.22} clearcoat={1} />
      </mesh>
      {/* Hinge */}
      <mesh rotation-z={Math.PI / 2} position={[0, BASE_T + 0.01, -baseD / 2 + 0.02]}>
        <cylinderGeometry args={[0.03, 0.03, lidW * 0.86, 20]} />
        <meshStandardMaterial color="#1a1c20" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Lid pivots on the hinge: 0 is upright, +π/2 lies closed over the keys. */}
      <group position={[0, BASE_T + LID_T / 2 + KEY_CLEARANCE, -baseD / 2 + LID_T / 2]} rotation-x={lidAngle}>
        <group position={[0, lidH / 2, 0]}>
          <RoundedBox args={[lidW, lidH, LID_T]} radius={0.02} smoothness={4}>
            <meshPhysicalMaterial color={bodyColor} metalness={0.85} roughness={0.4} envMapIntensity={1.5} clearcoat={0.4} clearcoatRoughness={0.3} />
          </RoundedBox>
          {/* Black glass bezel */}
          <mesh geometry={glassFront} position={[0, 0, front + 0.001]}>
            <meshStandardMaterial color="#050507" roughness={0.3} metalness={0} />
          </mesh>
          <mesh geometry={screen} position={[0, (BEZEL_CHIN - BEZEL_TOP) / 2, front + 0.002]}>
            {/* Keyed so the textured material is a new instance. Without the key React
                patches the placeholder in place: its dark color stays and multiplies the
                map to black, and the shader was compiled without a map. It only rendered
                when the image happened to load before the canvas mounted. */}
            {texture ? (
              <meshBasicMaterial key={texture.uuid} map={texture} toneMapped={false} />
            ) : (
              <meshBasicMaterial key="placeholder" color="#101217" />
            )}
          </mesh>
          {/* Camera */}
          <mesh position={[0, lidH / 2 - BEZEL_TOP / 2, front + 0.003]}>
            <circleGeometry args={[0.014, 24]} />
            <meshStandardMaterial color="#1c2230" roughness={0.1} metalness={0.4} />
          </mesh>
          {/* Glass: additive reflection only, so the screen underneath never dims.
              The environment is fixed, so the streaks slide as the laptop turns. */}
          <mesh geometry={glassFront} position={[0, 0, front + 0.004]}>
            <meshPhysicalMaterial
              color="#000000"
              roughness={0.04}
              metalness={0}
              envMapIntensity={0.7}
              transparent
              opacity={glare}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
};

// --------------------------------------------------------------------- camera

const CameraRig: React.FC<{ position: Vec3; target: Vec3 }> = ({ position, target }) => {
  const camera = useThree((state) => state.camera);
  const [px, py, pz] = position;
  const [tx, ty, tz] = target;
  useLayoutEffect(() => {
    camera.position.set(px, py, pz);
    camera.lookAt(tx, ty, tz);
    camera.updateMatrixWorld();
  }, [camera, px, py, pz, tx, ty, tz]);
  return null;
};

// ---------------------------------------------------------------------- scene

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SET_DOWN = Easing.bezier(0.16, 1, 0.3, 1);
const IN_OUT = Easing.inOut(Easing.sin);

/**
 * Every value is a pure function of the frame. Beat 1 sets the laptop down and
 * opens the lid; beat 2 turns it and pushes in. A small linear drift runs under
 * both so the last frame still moves — an ease-out over the whole clip parks
 * the shot by the midpoint.
 */
const useShot = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const last = Math.max(2, durationInFrames - 1);
  const turnStart = Math.min(40, Math.floor(last * 0.3));
  const drift = interpolate(frame, [0, last], [0, 1], clamp);
  const turn = interpolate(frame, [turnStart, last], [0, 1], { ...clamp, easing: IN_OUT });
  const settle = interpolate(frame, [0, Math.min(44, last)], [0, 1], { ...clamp, easing: SET_DOWN });
  const lid = interpolate(frame, [Math.min(6, last - 1), Math.min(56, last)], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

  return {
    lift: interpolate(settle, [0, 1], [0.45, 0]),
    lidAngle: interpolate(lid, [0, 1], [LID_CLOSED, LID_OPEN]),
    yaw: -0.55 + turn * 0.7 + drift * 0.12,
    camera: [
      0,
      interpolate(settle, [0, 1], [2.5, 1.7]) - turn * 0.2,
      6.2 - turn * 1.1 - drift * 0.2,
    ] as Vec3,
    // The target rises with the lid, so a closed laptop is not parked in the
    // bottom third of the frame under empty space.
    target: [0, interpolate(lid, [0, 1], [0.35, 0.95]) - turn * 0.05, -0.2] as Vec3,
  };
};

export const DeviceMockup3D: React.FC<DeviceMockup3DProps> = ({
  src = DEFAULT_SCREEN_SRC,
  screenAspect,
  backgroundColor = "#0a0c11",
  glowColor = "#1c212c",
  floorColor = "#434a57",
  bodyColor = "#9ba1ab",
  rimColor = "#7aa2ff",
  accentColor = "#ffb27a",
  glare = 1,
}) => {
  const { width, height } = useVideoConfig();
  const { texture, release } = useScreenTexture(src);
  const shot = useShot();
  const image = texture?.image as { width?: number; height?: number } | undefined;
  const aspect =
    screenAspect ??
    (image?.width && image?.height ? image.width / image.height : DEFAULT_ASPECT);
  const safeGlare = Math.min(1, Math.max(0, Number.isFinite(glare) ? glare : 1));

  return (
    <AbsoluteFill
      style={{ background: `radial-gradient(ellipse at 50% 40%, ${glowColor}, ${backgroundColor} 72%)` }}
    >
      <ThreeCanvas width={width} height={height} camera={{ position: shot.camera, fov: 34 }}>
        <CameraRig position={shot.camera} target={shot.target} />
        <ScreenReady texture={texture} onReady={release} />
        {/* Lightformers build the env map locally; presets fetch HDRIs from a CDN. */}
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={4} position={[0, 5, 1]} rotation-x={Math.PI / 2} scale={[10, 5, 1]} />
          {/* Low front fill for the aluminium. Kept high and dim: the glass mirrors it straight back over the screen. */}
          <Lightformer intensity={0.5} position={[0, 4.5, 4]} rotation-x={Math.PI / 4} scale={[9, 2, 1]} />
          {/* Rim and accent sit behind the device. In front of it, the glass mirrors
              them straight back while the laptop is turned toward that side and the
              screen washes out in their color. */}
          <Lightformer intensity={4} position={[-5, 1.2, -1.5]} rotation-y={1.28} scale={[6, 3, 1]} color={rimColor} />
          <Lightformer intensity={3.5} position={[5, 1.2, -1.5]} rotation-y={-1.28} scale={[6, 3, 1]} color={accentColor} />
          {/* Narrow strips in front: the streaks that sweep the glass as it turns. */}
          <Lightformer intensity={4} position={[-2.2, 1.5, 6]} rotation-y={Math.PI} scale={[0.6, 7, 1]} />
          <Lightformer intensity={2} position={[2.8, 1.5, 6]} rotation-y={Math.PI} scale={[0.25, 7, 1]} />
        </Environment>
        <ambientLight intensity={0.25} />
        <FloorPool color={floorColor} />
        <group position={[0, shot.lift, 0]} rotation-y={shot.yaw}>
          <Laptop
            texture={texture}
            aspect={aspect}
            bodyColor={bodyColor}
            glare={safeGlare}
            lidAngle={shot.lidAngle}
          />
        </group>
        <ContactShadows position={[0, 0, 0]} opacity={0.85} scale={9} blur={2.4} far={1.6} resolution={1024} frames={Infinity} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
