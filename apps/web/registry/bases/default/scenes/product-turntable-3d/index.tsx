import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
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
  AnimationMixer,
  Box3,
  CanvasTexture,
  Color,
  LatheGeometry,
  type Object3D,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const TAU = Math.PI * 2;

export type ProductTurntable3dProps = {
  /**
   * Optional `.glb` / `.gltf` — `staticFile("bag.glb")` or a CORS-enabled URL.
   * Omit it and the built-in bottle is used, so the scene works with no assets.
   * Meshopt, DRACO and KTX2 compression are not decoded; export uncompressed.
   */
  src?: string;
  /** The model is scaled so its bounding box is this many units tall. */
  fitHeight?: number;
  /** Turns the product makes across the whole clip. */
  revolutions?: number;
  /** Where the turn starts, in radians. Use it to choose which face opens the shot. */
  startAngle?: number;
  /** Outer backdrop color. */
  backgroundColor?: string;
  /** Soft glow behind the product. */
  glowColor?: string;
  /** Lit floor pool the contact shadow falls on. Keep it lighter than the backdrop. */
  floorColor?: string;
  /** Turntable platter color. */
  platterColor?: string;
  /** Built-in bottle glass color. Ignored when `src` is set. */
  productColor?: string;
  /** Built-in bottle cap color. Ignored when `src` is set. */
  capColor?: string;
  /** Built-in label stock color. Ignored when `src` is set. */
  labelColor?: string;
  /** Built-in label print color. Ignored when `src` is set. */
  labelInkColor?: string;
  /** Cool rim light from behind left. */
  rimColor?: string;
  /** Warm accent light from behind right. */
  accentColor?: string;
};

type Vec3 = [number, number, number];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SET_DOWN = Easing.bezier(0.16, 1, 0.3, 1);

// ----------------------------------------------------------------- built-in

const BODY_TOP = 1.64;
const LABEL_H = 0.66;
const LABEL_Y = 0.6;
const BODY_R = 0.66;

/**
 * Bottle silhouette as a lathe profile: `[radius, height]` pairs from the
 * centre of the base up to the lip. Curved runs are sampled densely so the
 * lathe's smooth normals do not facet across the shoulder.
 */
const BOTTLE_PROFILE: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.32, 0],
  [0.54, 0],
  [0.605, 0.006],
  [0.645, 0.036],
  [0.66, 0.088],
  [0.66, 1.0],
  [0.657, 1.1],
  [0.645, 1.182],
  [0.62, 1.256],
  [0.576, 1.322],
  [0.516, 1.376],
  [0.442, 1.42],
  [0.357, 1.451],
  [0.292, 1.466],
  [0.256, 1.477],
  [0.246, 1.502],
  [0.246, 1.6],
  [0.262, 1.622],
  [0.262, BODY_TOP],
];

const useBottleGeometry = (): LatheGeometry => {
  const geometry = useMemo(
    () =>
      new LatheGeometry(
        BOTTLE_PROFILE.map(([r, y]) => new Vector2(r, y)),
        96,
      ),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
};

const LABEL_W_PX = 1536;
const LABEL_H_PX = 256;

/**
 * The label is drawn locally into a canvas rather than shipped as an image: a
 * registry scene must not depend on an asset file, and a fetched one would
 * need the same delayRender dance as the GLTF. Type is drawn as bars, never
 * as canvas text — a real font would make the still a function of whichever
 * faces the render machine happens to have installed.
 */
const drawLabel = (labelColor: string, inkColor: string): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = LABEL_W_PX;
  canvas.height = LABEL_H_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = labelColor;
  ctx.fillRect(0, 0, LABEL_W_PX, LABEL_H_PX);

  // Hairline rules top and bottom, inset like a printed border.
  ctx.fillStyle = inkColor;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(0, 22, LABEL_W_PX, 3);
  ctx.fillRect(0, LABEL_H_PX - 25, LABEL_W_PX, 3);
  ctx.globalAlpha = 1;

  // Front: ring mark plus three weight-graded bars standing in for a lockup.
  const cx = LABEL_W_PX / 2;
  const cy = LABEL_H_PX / 2;
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx - 210, cy, 62, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - 210, cy, 24, 0, TAU);
  ctx.fillStyle = inkColor;
  ctx.fill();

  const bars: readonly (readonly [number, number, number])[] = [
    [-38, 300, 26],
    [12, 210, 12],
    [42, 128, 12],
  ];
  for (const [dy, w, h] of bars) {
    ctx.fillStyle = inkColor;
    ctx.globalAlpha = h > 20 ? 1 : 0.55;
    ctx.fillRect(cx - 110, cy + dy - h / 2, w, h);
  }
  ctx.globalAlpha = 1;

  // Back panel, drawn at both seam ends so the wrap has no cut. Seeded widths
  // keep it identical on every machine and every frame.
  const drawBack = (originX: number) => {
    let x = originX - 150;
    for (let i = 0; i < 26; i += 1) {
      const w = 4 + ((i * 7) % 3) * 4;
      ctx.fillStyle = inkColor;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(x, cy - 46, w, 92);
      x += w + 6;
    }
    ctx.globalAlpha = 0.45;
    ctx.fillRect(originX - 150, cy + 62, 210, 9);
    ctx.globalAlpha = 1;
  };
  drawBack(0);
  drawBack(LABEL_W_PX);

  return canvas;
};

const useLabelTexture = (labelColor: string, inkColor: string): CanvasTexture => {
  const texture = useMemo(() => {
    const result = new CanvasTexture(drawLabel(labelColor, inkColor));
    result.colorSpace = SRGBColorSpace;
    result.anisotropy = 8;
    return result;
  }, [labelColor, inkColor]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
};

const Bottle: React.FC<{
  productColor: string;
  capColor: string;
  labelColor: string;
  labelInkColor: string;
}> = ({ productColor, capColor, labelColor, labelInkColor }) => {
  const body = useBottleGeometry();
  const label = useLabelTexture(labelColor, labelInkColor);

  return (
    <group>
      <mesh geometry={body}>
        <meshPhysicalMaterial
          color={productColor}
          roughness={0.11}
          metalness={0}
          ior={1.5}
          clearcoat={1}
          clearcoatRoughness={0.06}
          envMapIntensity={1.6}
        />
      </mesh>
      {/* Paper label, a hair proud of the glass so it never z-fights. */}
      <mesh position={[0, LABEL_Y, 0]}>
        <cylinderGeometry args={[BODY_R + 0.008, BODY_R + 0.008, LABEL_H, 96, 1, true]} />
        <meshStandardMaterial map={label} roughness={0.82} metalness={0} envMapIntensity={0.6} />
      </mesh>
      {/* Cap: brushed metal barrel, knurl ring, inset top. */}
      <mesh position={[0, 1.79, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.36, 72]} />
        <meshPhysicalMaterial
          color={capColor}
          metalness={1}
          roughness={0.28}
          envMapIntensity={1.8}
          clearcoat={0.4}
          clearcoatRoughness={0.3}
        />
      </mesh>
      {/* Rotated flat: a torus is built in the XY plane, so an unrotated one
          stands up like a handle instead of banding the cap. */}
      <mesh position={[0, 1.655, 0]} rotation-x={-Math.PI / 2}>
        <torusGeometry args={[0.298, 0.016, 12, 72]} />
        <meshStandardMaterial color={capColor} metalness={1} roughness={0.42} envMapIntensity={1.5} />
      </mesh>
      <mesh position={[0, 1.971, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.245, 64]} />
        <meshStandardMaterial color={capColor} metalness={1} roughness={0.5} envMapIntensity={1.2} />
      </mesh>
    </group>
  );
};

// --------------------------------------------------------------------- GLTF

type LoadedModel = {
  scene: Object3D;
  mixer: AnimationMixer | null;
};

/** Resource base so a `.gltf` with sibling `.bin`/textures still resolves off a blob URL. */
const resourcePath = (src: string): string => {
  const cut = src.lastIndexOf("/");
  return cut === -1 ? "" : src.slice(0, cut + 1);
};

const loadModel = async (src: string, signal: AbortSignal): Promise<LoadedModel> => {
  const response = await fetch(src, { signal });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const objectUrl = URL.createObjectURL(await response.blob());
  try {
    const loader = new GLTFLoader();
    loader.setResourcePath(resourcePath(src));
    const gltf = await loader.loadAsync(objectUrl);
    let mixer: AnimationMixer | null = null;
    if (gltf.animations.length > 0) {
      // Played once only to bind the tracks. The mixer is never advanced by a
      // delta: every frame sets the pose absolutely with setTime(), which is
      // idempotent and survives the out-of-order frames a render can request.
      mixer = new AnimationMixer(gltf.scene);
      for (const clip of gltf.animations) {
        mixer.clipAction(clip).play();
      }
      mixer.setTime(0);
    }
    return { scene: gltf.scene, mixer };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

type ModelState = {
  model: LoadedModel | null;
  release: () => void;
};

/**
 * Loaded by hand behind delayRender rather than through drei's `useGLTF`,
 * which suspends: a suspended frame can be captured before the model exists
 * and the render exits 0 on an empty turntable.
 *
 * The hold is released by `<ModelReady>` inside the canvas, not on load. In a
 * render ThreeCanvas draws only when the frame changes, so a model that lands
 * after that draw would never appear in the captured frame.
 */
const useProductModel = (src: string | undefined): ModelState => {
  const [model, setModel] = useState<LoadedModel | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const pending = useRef<number | null>(null);

  const release = useCallback(() => {
    const handle = pending.current;
    if (handle === null) return;
    pending.current = null;
    continueRender(handle);
  }, [continueRender]);

  useEffect(() => {
    if (!src) {
      setModel(null);
      return;
    }
    pending.current = delayRender(`Loading product model: ${src}`);
    const controller = new AbortController();
    let active = true;

    loadModel(src, controller.signal).then(
      (result) => {
        if (!active) return;
        setModel(result);
      },
      (error: unknown) => {
        if (!active) return;
        const reason = error instanceof Error ? error.message : String(error);
        cancelRender(
          new Error(
            `ProductTurntable3d: could not load model "${src}" (${reason}). Use staticFile() or a CORS-enabled URL, and export uncompressed glTF (no DRACO/Meshopt/KTX2).`,
          ),
        );
      },
    );

    return () => {
      active = false;
      controller.abort();
      release();
    };
  }, [src, delayRender, cancelRender, release]);

  return { model, release };
};

/** Inside the canvas: draws one frame with the model committed, then continues the render. */
const ModelReady: React.FC<{ model: LoadedModel | null; onReady: () => void }> = ({
  model,
  onReady,
}) => {
  const advance = useThree((state) => state.advance);

  useEffect(() => {
    if (!model) return;
    advance(performance.now());
    onReady();
  }, [model, advance, onReady]);

  return null;
};

/**
 * Normalises any model onto the platter: centred in x/z, base at y=0, scaled
 * to `fitHeight`. Computed from the bounding box rather than mutating the
 * loaded scene, so the transform is a prop on the wrapping group.
 */
const useModelFit = (scene: Object3D | undefined, fitHeight: number) =>
  useMemo(() => {
    if (!scene) return { scale: 1, offset: [0, 0, 0] as Vec3 };
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const height = size.y > 1e-6 ? size.y : 1;
    const scale = fitHeight / height;
    return {
      scale,
      offset: [-center.x * scale, -box.min.y * scale, -center.z * scale] as Vec3,
    };
  }, [scene, fitHeight]);

const GltfProduct: React.FC<{ model: LoadedModel; fitHeight: number }> = ({ model, fitHeight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fit = useModelFit(model.scene, fitHeight);
  const { mixer } = model;

  useLayoutEffect(() => {
    if (!mixer) return;
    mixer.setTime(frame / fps);
  }, [mixer, frame, fps]);

  return (
    <group position={fit.offset} scale={fit.scale}>
      <primitive object={model.scene} />
    </group>
  );
};

// ------------------------------------------------------------------- staging

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

/** A lit pool on the floor: a dark shadow on a dark backdrop is invisible. */
const FloorPool: React.FC<{ color: string }> = ({ color }) => {
  const uniforms = useMemo(() => ({ uColor: { value: new Color(color) } }), [color]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.16, 0]}>
      <planeGeometry args={[11, 11]} />
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

/**
 * The platter turns with the product. It is what sells the shot as a
 * turntable rather than a spinning object, and it keeps the rotation legible
 * even when the product on it is radially symmetric.
 */
const Platter: React.FC<{ color: string }> = ({ color }) => (
  <group>
    <mesh position={[0, -0.075, 0]}>
      <cylinderGeometry args={[1.85, 1.9, 0.15, 96]} />
      <meshPhysicalMaterial
        color={color}
        metalness={0.9}
        roughness={0.34}
        envMapIntensity={1.2}
        clearcoat={0.5}
        clearcoatRoughness={0.4}
      />
    </mesh>
    {/* Machined grooves: a moving highlight the eye can track around the turn.
        They sit just *above* the platter top (y=0), not at it — coplanar with
        the cylinder cap they are swallowed by it and the platter reads as a
        dead black disc. */}
    {[1.22, 1.58].map((radius) => (
      <mesh key={radius} position={[0, 0.004, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[radius, radius + 0.022, 128]} />
        <meshStandardMaterial color="#e8eaf0" metalness={1} roughness={0.28} envMapIntensity={1.4} />
      </mesh>
    ))}
    {/* Polished edge band, laid flat around the rim. */}
    <mesh position={[0, 0.002, 0]} rotation-x={-Math.PI / 2}>
      <torusGeometry args={[1.866, 0.013, 10, 160]} />
      <meshStandardMaterial color="#cfd4dd" metalness={1} roughness={0.25} envMapIntensity={1.7} />
    </mesh>
  </group>
);

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

// --------------------------------------------------------------------- shot

/**
 * Every value is a pure function of the frame, and the clip self-paces off
 * `durationInFrames`. The turn is linear across the whole window rather than
 * eased, so the last frame is still moving: an ease-out over the full clip
 * parks the shot and the stills audit reads a frozen tail. The camera "holds"
 * in the sense that it does not orbit — it only drifts in a little.
 */
const useShot = (revolutions: number, startAngle: number) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const last = Math.max(2, durationInFrames - 1);
  const drift = interpolate(frame, [0, last], [0, 1], clamp);
  const settle = interpolate(frame, [0, Math.min(38, Math.round(last * 0.35))], [0, 1], {
    ...clamp,
    easing: SET_DOWN,
  });

  return {
    spin: startAngle + drift * revolutions * TAU,
    lift: interpolate(settle, [0, 1], [0.7, 0]),
    camera: [
      0,
      interpolate(settle, [0, 1], [2.15, 1.62]) - drift * 0.16,
      5.85 - drift * 0.42,
    ] as Vec3,
    target: [0, interpolate(settle, [0, 1], [1.15, 0.94]), 0] as Vec3,
  };
};

export const ProductTurntable3d: React.FC<ProductTurntable3dProps> = ({
  src,
  fitHeight = 2,
  revolutions = 1,
  startAngle = -0.45,
  backgroundColor = "#090b10",
  glowColor = "#1b2130",
  floorColor = "#465063",
  platterColor = "#3a404c",
  productColor = "#12433a",
  capColor = "#c9a96b",
  labelColor = "#f1ebdd",
  labelInkColor = "#16241f",
  rimColor = "#7fa8ff",
  accentColor = "#ffb887",
}) => {
  const { width, height } = useVideoConfig();
  const { model, release } = useProductModel(src);
  // Defaulted before use: spreading an undefined prop straight into the
  // interpolate below yields NaN transforms and a silently empty frame.
  const safeFit = Number.isFinite(fitHeight) && fitHeight > 0 ? fitHeight : 2;
  const safeRevolutions = Number.isFinite(revolutions) ? revolutions : 1;
  const safeStart = Number.isFinite(startAngle) ? startAngle : -0.45;
  const shot = useShot(safeRevolutions, safeStart);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 42%, ${glowColor}, ${backgroundColor} 70%)`,
      }}
    >
      <ThreeCanvas width={width} height={height} camera={{ position: shot.camera, fov: 32 }}>
        <CameraRig position={shot.camera} target={shot.target} />
        <ModelReady model={model} onReady={release} />
        {/* Lightformers build the env map locally; presets fetch an HDRI from a CDN. */}
        <Environment resolution={256} frames={1}>
          {/* Soft key: a broad overhead box, the studio softbox. */}
          <Lightformer intensity={4.2} position={[0, 6, 1.5]} rotation-x={Math.PI / 2} scale={[10, 6, 1]} />
          <Lightformer intensity={0.6} position={[0, 3, 6]} rotation-x={Math.PI / 6} scale={[9, 3, 1]} />
          {/* Rim pair behind the product: what separates it from the backdrop. */}
          <Lightformer intensity={5} position={[-5, 1.6, -2.5]} rotation-y={1.3} scale={[6, 4, 1]} color={rimColor} />
          <Lightformer intensity={4} position={[5, 1.6, -2.5]} rotation-y={-1.3} scale={[6, 4, 1]} color={accentColor} />
          {/* Narrow strips in front: the vertical highlights that sweep the
              glass and the cap as the product turns under them. */}
          <Lightformer intensity={5} position={[-2.4, 1.6, 6]} rotation-y={Math.PI} scale={[0.5, 8, 1]} />
          <Lightformer intensity={2.4} position={[2.9, 1.6, 6]} rotation-y={Math.PI} scale={[0.22, 8, 1]} />
        </Environment>
        <ambientLight intensity={0.3} />
        <FloorPool color={floorColor} />
        <group position={[0, shot.lift, 0]} rotation-y={shot.spin}>
          <Platter color={platterColor} />
          {model ? (
            <GltfProduct model={model} fitHeight={safeFit} />
          ) : src ? null : (
            <Bottle
              productColor={productColor}
              capColor={capColor}
              labelColor={labelColor}
              labelInkColor={labelInkColor}
            />
          )}
        </group>
        {/* Anchors the platter to the floor. frames={Infinity} because the
            occluders turn: a baked shadow would desync from the product. */}
        <ContactShadows
          position={[0, -0.155, 0]}
          opacity={0.9}
          scale={11}
          blur={2.6}
          far={2.2}
          resolution={1024}
          frames={Infinity}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
