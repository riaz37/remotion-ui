import { ContactShadows, Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useEffect, useLayoutEffect, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Color, Float32BufferAttribute, Shape, ShapeGeometry } from "three";

export type CardStack3dProps = {
  /** How many cards are in the deck. 3–7 reads best; more than that and the fan leaves frame. */
  count?: number;
  /** Card body colors, cycled if shorter than `count`. */
  colors?: string[];
  /** Ink used for the procedural face content (media plate, bars, pill). */
  faceInkColor?: string;
  /** Outer backdrop color. */
  backgroundColor?: string;
  /** Soft glow behind the deck. */
  glowColor?: string;
  /** Lit floor pool the contact shadow falls on. Keep it lighter than the backdrop. */
  floorColor?: string;
  /** Cool rim light from the left; this is what lights the card edges. */
  rimColor?: string;
  /** Warm accent light from the right. */
  accentColor?: string;
};

const DEFAULT_COLORS = ["#3b6ef6", "#7c5cf0", "#e0573f", "#18a07a", "#f0a23c"];

// ------------------------------------------------------------------- geometry

const CARD_W = 1.6;
const CARD_H = 2.2;
/** Real thickness: the whole point of the scene is that the depth is geometry. */
const CARD_T = 0.1;
const CARD_R = 0.11;
/** Low enough that the deck stays inside the contact shadow's `far` range. */
const DECK_Y = 1.35;

type Vec3 = [number, number, number];

/** Rounded rectangle with UVs spanning 0–1, used for the flat face details. */
const roundedRect = (w: number, h: number, r: number): ShapeGeometry => {
  const x = -w / 2;
  const y = -h / 2;
  const radius = Math.min(r, w / 2, h / 2);
  const shape = new Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + w - radius, y);
  shape.absarc(x + w - radius, y + radius, radius, -Math.PI / 2, 0, false);
  shape.lineTo(x + w, y + h - radius);
  shape.absarc(x + w - radius, y + h - radius, radius, 0, Math.PI / 2, false);
  shape.lineTo(x + radius, y + h);
  shape.absarc(x + radius, y + h - radius, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + radius);
  shape.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5, false);

  const geometry = new ShapeGeometry(shape, 8);
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
      <planeGeometry args={[16, 16]} />
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

// ----------------------------------------------------------------------- card

type FaceProps = { ink: string; index: number };

/**
 * Procedural card face: a media plate, a pill and three text bars whose widths
 * vary by index. No assets, so nothing can 404 mid-render and no texture needs
 * a delayRender hold.
 */
const CardFace: React.FC<FaceProps> = ({ ink, index }) => {
  const pad = 0.16;
  const innerW = CARD_W - pad * 2;
  const mediaH = CARD_H * 0.42;
  const media = useRoundedRect(innerW, mediaH, 0.07);
  const pill = useRoundedRect(innerW * 0.42, 0.115, 0.058);
  const barGeometry = useRoundedRect(innerW, 0.085, 0.042);
  // Deterministic per-card variation: no Math.random anywhere in the scene.
  const barScales = [1, 0.86, 0.54].map((base) => base - ((index % 3) * 0.07));
  const z = CARD_T / 2 + 0.002;
  const mediaTop = CARD_H / 2 - pad;

  return (
    <group position={[0, 0, z]}>
      <mesh geometry={media} position={[0, mediaTop - mediaH / 2, 0]}>
        <meshStandardMaterial
          color={ink}
          roughness={0.35}
          metalness={0}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh geometry={pill} position={[-innerW / 2 + innerW * 0.21, mediaTop - mediaH - 0.18, 0]}>
        <meshStandardMaterial color={ink} roughness={0.45} metalness={0} transparent opacity={0.55} />
      </mesh>
      {barScales.map((scale, i) => (
        <mesh
          key={i}
          geometry={barGeometry}
          position={[-innerW / 2 + (innerW * scale) / 2, mediaTop - mediaH - 0.42 - i * 0.17, 0]}
          scale={[scale, 1, 1]}
        >
          <meshStandardMaterial
            color={ink}
            roughness={0.5}
            metalness={0}
            transparent
            opacity={i === 0 ? 0.85 : 0.4}
          />
        </mesh>
      ))}
    </group>
  );
};

type CardProps = {
  color: string;
  ink: string;
  index: number;
  position: Vec3;
  rotation: Vec3;
};

/**
 * One physical card. The edge highlight is not painted: the body is a
 * clearcoated physical material and the rounded rim catches the narrow
 * Lightformer strips, so the highlight travels as the card turns.
 */
const Card: React.FC<CardProps> = ({ color, ink, index, position, rotation }) => (
  <group position={position} rotation={rotation}>
    <RoundedBox args={[CARD_W, CARD_H, CARD_T]} radius={CARD_R} smoothness={5}>
      <meshPhysicalMaterial
        color={color}
        metalness={0.25}
        roughness={0.32}
        envMapIntensity={1.5}
        clearcoat={1}
        clearcoatRoughness={0.12}
        reflectivity={0.6}
      />
    </RoundedBox>
    <CardFace ink={ink} index={index} />
  </group>
);

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

// ---------------------------------------------------------------------- shot

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SETTLE = Easing.bezier(0.16, 1, 0.3, 1);
const TURN = Easing.inOut(Easing.cubic);

const SPREAD_X = 1.12;
const SPREAD_Y = 0.1;
const SPREAD_Z = 0.62;
/**
 * Raked, not edge-on. At -1.18 the mid-turn frames were razor-thin slivers with
 * no face visible at all, and the shot read as broken rather than as a deck.
 */
const EDGE_ON = -0.72;

type CardPose = { position: Vec3; rotation: Vec3 };

/**
 * Every value is a pure function of the frame. Beat 1 fans the deck out in
 * depth with a per-card stagger; beat 2 turns each card to face the camera
 * while the camera swings round and pushes in. A linear deck yaw and a sine
 * bob run under both, so the last frame is never parked.
 */
const useShot = (count: number) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const last = Math.max(2, durationInFrames - 1);

  const stagger = Math.min(7, last * 0.045);
  const fanStart = Math.min(6, last * 0.05);
  const fanDuration = Math.max(8, Math.min(34, last * 0.3));
  const turnDuration = Math.max(8, Math.min(46, last * 0.4));

  const drift = interpolate(frame, [0, last], [0, 1], clamp);
  const seconds = frame / fps;
  const center = (count - 1) / 2;

  const poses: CardPose[] = Array.from({ length: count }, (_, i) => {
    const o = i - center;
    const fanFrom = fanStart + i * stagger;
    const fan = interpolate(frame, [fanFrom, fanFrom + fanDuration], [0, 1], {
      ...clamp,
      easing: SETTLE,
    });
    const turnFrom = fanFrom + fanDuration * 0.3;
    const turn = interpolate(frame, [turnFrom, turnFrom + turnDuration], [0, 1], {
      ...clamp,
      easing: TURN,
    });
    // Bob keeps every card alive on the tail; phase-shifted per card.
    const bob = Math.sin(seconds * 1.1 + i * 0.9) * 0.035;

    return {
      position: [
        o * SPREAD_X * fan,
        (o * SPREAD_Y - 0.55 * (1 - fan)) * 1 + bob,
        // Stacked: the deck is a tight pile in depth. Fanned: a shallow arc.
        (i - count + 1) * (CARD_T * 1.25) * (1 - fan) + o * SPREAD_Z * fan,
      ],
      rotation: [
        interpolate(fan, [0, 1], [0.16, 0]) + bob * 0.25,
        interpolate(turn, [0, 1], [EDGE_ON, o * 0.16]),
        interpolate(fan, [0, 1], [-0.1, 0]) + o * 0.035,
      ],
    };
  });

  const push = interpolate(frame, [fanStart, last * 0.92], [0, 1], { ...clamp, easing: TURN });

  return {
    poses,
    // Linear, so the frame never stops moving even after the eased beats land.
    deckYaw: interpolate(drift, [0, 1], [-0.42, 0.06]),
    deckLift: interpolate(frame, [0, Math.min(40, last)], [0, 1], { ...clamp, easing: SETTLE }),
    camera: [
      // Opens closer and lower: from 7.9 the un-fanned pile was a thumbnail in
      // the middle of an empty plate on frame 0.
      interpolate(push, [0, 1], [1.3, -0.35]) - drift * 0.25,
      interpolate(push, [0, 1], [1.75, 1.6]),
      interpolate(push, [0, 1], [5.2, 6.9]) - drift * 0.3,
    ] as Vec3,
    target: [0, DECK_Y + drift * 0.05, 0] as Vec3,
  };
};

export const CardStack3d: React.FC<CardStack3dProps> = ({
  count = 5,
  colors = DEFAULT_COLORS,
  faceInkColor = "#f4f6fb",
  backgroundColor = "#080a0f",
  glowColor = "#1a2030",
  floorColor = "#3f4757",
  rimColor = "#7aa2ff",
  accentColor = "#ffb27a",
}) => {
  const { width, height } = useVideoConfig();
  const safeColors = colors.length > 0 ? colors : DEFAULT_COLORS;
  const safeCount = Math.max(1, Math.min(9, Math.round(Number.isFinite(count) ? count : 5)));
  const shot = useShot(safeCount);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 42%, ${glowColor}, ${backgroundColor} 70%)`,
      }}
    >
      <ThreeCanvas width={width} height={height} camera={{ position: shot.camera, fov: 38 }}>
        <CameraRig position={shot.camera} target={shot.target} />
        {/* Lightformers build the env map locally; presets fetch HDRIs from a CDN. */}
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={3.2} position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[12, 6, 1]} />
          <Lightformer intensity={0.6} position={[0, 3, 7]} rotation-x={Math.PI / 6} scale={[10, 3, 1]} />
          {/* Narrow strips: these are the specular lines that ride the card rims. */}
          <Lightformer intensity={6} position={[-3.2, 2, 5]} rotation-y={Math.PI} scale={[0.35, 9, 1]} />
          <Lightformer intensity={4} position={[3.6, 2, 5]} rotation-y={Math.PI} scale={[0.2, 9, 1]} />
          <Lightformer intensity={4} position={[-6, 2, -2]} rotation-y={1.3} scale={[6, 4, 1]} color={rimColor} />
          <Lightformer intensity={3.2} position={[6, 2, -2]} rotation-y={-1.3} scale={[6, 4, 1]} color={accentColor} />
        </Environment>
        <ambientLight intensity={0.3} />
        <directionalLight position={[-4, 6, 5]} intensity={0.8} color={rimColor} />
        <FloorPool color={floorColor} />
        <group
          position={[0, DECK_Y + interpolate(shot.deckLift, [0, 1], [0.5, 0]), 0]}
          rotation-y={shot.deckYaw}
        >
          {shot.poses.map((pose, i) => (
            <Card
              key={i}
              index={i}
              color={safeColors[i % safeColors.length]}
              ink={faceInkColor}
              position={pose.position}
              rotation={pose.rotation}
            />
          ))}
        </group>
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.85}
          scale={12}
          blur={2.2}
          far={2.6}
          resolution={1024}
          frames={Infinity}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
