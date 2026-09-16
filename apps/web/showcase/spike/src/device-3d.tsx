import { ContactShadows, Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { ThreeCanvas } from "@remotion/three";
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { SRGBColorSpace, type Texture, TextureLoader } from "three";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const SCREEN_SRC = staticFile("launch-film/04-preview-ready.png");
const SCREEN_W = 3.0;
const SCREEN_H = SCREEN_W * (1744 / 2880);
const BEZEL = 0.09;
const BODY_W = SCREEN_W + BEZEL * 2;
const BODY_H = SCREEN_H + BEZEL * 2;

// Loaded by hand behind delayRender: drei's useTexture suspends, and a
// suspended frame can be captured before the screen texture exists.
const useScreenTexture = (): Texture | null => {
  const [texture, setTexture] = useState<Texture | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender("Loading device screen"));

  useEffect(() => {
    new TextureLoader().load(
      SCREEN_SRC,
      (loaded) => {
        loaded.colorSpace = SRGBColorSpace;
        setTexture(loaded);
        continueRender(handle);
      },
      undefined,
      (err) => cancelRender(err),
    );
  }, [handle, continueRender, cancelRender]);

  return texture;
};

const Device: React.FC<{ texture: Texture }> = ({ texture }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const rise = interpolate(frame, [0, 45], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Every motion value is a pure function of the frame, never a clock.
  // A linear-in-time drift so the camera never parks: an ease-out stalls by mid-clip.
  const drift = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    easing: Easing.inOut(Easing.sin),
  });
  const yaw = interpolate(drift, [0, 1], [-0.62, 0.42]);
  const pitch = interpolate(rise, [0, 1], [0.42, 0.1]);
  const lift = interpolate(rise, [0, 1], [-0.7, 0]);
  const dolly = interpolate(drift, [0, 1], [-0.4, 0.35]);

  return (
    <group rotation={[pitch, yaw, 0]} position={[0, lift, dolly]}>
      <RoundedBox args={[BODY_W, BODY_H, 0.12]} radius={0.08} smoothness={6}>
        <meshPhysicalMaterial
          color="#3a3e47"
          metalness={0.75}
          roughness={0.32}
          clearcoat={1}
          clearcoatRoughness={0.15}
          envMapIntensity={1.6}
        />
      </RoundedBox>
      <mesh position={[0, 0, 0.061]}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
};

export const Device3D: React.FC = () => {
  const { width, height } = useVideoConfig();
  const texture = useScreenTexture();

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #1d2230, #07080b 70%)" }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0.2, 5.4], fov: 40 }}>
        {/* Lightformers build the env map locally; presets fetch HDRIs from a CDN. */}
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={6} position={[0, 4, 3]} rotation-x={Math.PI / 2} scale={[10, 3, 1]} />
          <Lightformer intensity={4} position={[-5, 0.5, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} color="#7aa2ff" />
          <Lightformer intensity={3.5} position={[5, 0.5, 2]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} color="#ffb27a" />
          <Lightformer intensity={2} position={[0, 0, 6]} scale={[8, 1, 1]} />
        </Environment>
        <ambientLight intensity={0.3} />
        {texture ? <Device texture={texture} /> : null}
        <ContactShadows position={[0, -1.35, 0]} opacity={0.55} scale={8} blur={2.6} far={2} frames={Infinity} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
