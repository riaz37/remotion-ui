import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { Color, ExtrudeGeometry, type Shape, ShapePath } from "three";

/**
 * A three.js "typeface" JSON (the facetype.js format `FontLoader` reads),
 * shipped with the site rather than fetched from a CDN: a render that waits on
 * a third-party font either hangs or draws an empty frame and still exits 0.
 *
 * `npx remotion-ui add text-extrude-3d` does not copy the JSON into your
 * `public/`. Download it once from
 * https://remotionui.com/fonts/geist-bold.typeface.json (Geist, SIL OFL 1.1)
 * or convert your own brand face with facetype.js, then point `fontUrl` at it.
 */
const DEFAULT_FONT_URL = "fonts/geist-bold.typeface.json";

export type TextExtrude3dProps = {
  /** Headline to extrude. Short and upper-case reads best at this depth. */
  text?: string;
  /** URL of a three.js typeface JSON. Defaults to `staticFile("fonts/geist-bold.typeface.json")`. */
  fontUrl?: string;
  /** Cap height in world units. */
  fontSize?: number;
  /** Extra letter spacing, in world units. */
  tracking?: number;
  /** How far the letters extrude toward the camera. */
  depth?: number;
  /** Bevel size on the front and back faces. This is what catches the key light. */
  bevel?: number;
  /** Letter face color. */
  color?: string;
  /** 0 = painted plastic, 1 = polished metal. */
  metalness?: number;
  /** 0 = mirror, 1 = matte. */
  roughness?: number;
  /** Outer backdrop color. */
  backgroundColor?: string;
  /** Glow behind the headline. */
  glowColor?: string;
  /** Cool rim light from the left. */
  rimColor?: string;
  /** Warm accent light from the right. */
  accentColor?: string;
};

// --------------------------------------------------------------------- glyphs

type TypefaceGlyph = {
  /** Horizontal advance, in font units. */
  ha: number;
  /** Outline: the `m`/`l`/`q`/`b` token stream. Absent on a space. */
  o?: string;
};

type TypefaceData = {
  glyphs: Record<string, TypefaceGlyph>;
  /** Font units per em. Every coordinate above is expressed in these. */
  resolution: number;
  familyName?: string;
};

const isTypeface = (value: unknown): value is TypefaceData => {
  const data = value as TypefaceData | null;
  return Boolean(
    data &&
      typeof data === "object" &&
      typeof data.resolution === "number" &&
      data.resolution > 0 &&
      data.glyphs &&
      typeof data.glyphs === "object",
  );
};

/**
 * The outline parser from three's `FontLoader`, inlined.
 *
 * Importing `three/examples/jsm/loaders/FontLoader.js` would work here, but it
 * would also make this scene depend on a deep path into three's addons that a
 * copied project has to resolve. The token grammar is four cases; owning them
 * keeps the component's dependency list to `three` itself.
 */
const glyphToShapes = (glyph: TypefaceGlyph, scale: number): Shape[] => {
  if (!glyph.o) {
    return [];
  }

  const path = new ShapePath();
  const tokens = glyph.o.split(" ");
  const next = (index: number) => Number(tokens[index]) * scale;

  let i = 0;
  while (i < tokens.length) {
    const action = tokens[i++];
    if (action === "m") {
      path.moveTo(next(i++), next(i++));
    } else if (action === "l") {
      path.lineTo(next(i++), next(i++));
    } else if (action === "q") {
      // Stored end-point first, control point second.
      const x = next(i++);
      const y = next(i++);
      path.quadraticCurveTo(next(i++), next(i++), x, y);
    } else if (action === "b") {
      const x = next(i++);
      const y = next(i++);
      const c1x = next(i++);
      const c1y = next(i++);
      path.bezierCurveTo(c1x, c1y, next(i++), next(i++), x, y);
    }
  }

  return path.toShapes();
};

type Letter = {
  key: string;
  geometry: ExtrudeGeometry;
  /** Center of the letter in the laid-out line, before the line is centered. */
  x: number;
};

type Layout = {
  letters: Letter[];
  /** Full advance width of the line, so the group can be centered on it. */
  width: number;
};

const EMPTY_LAYOUT: Layout = { letters: [], width: 0 };

const layoutText = (
  font: TypefaceData,
  text: string,
  fontSize: number,
  tracking: number,
  depth: number,
  bevel: number,
): Layout => {
  const scale = fontSize / font.resolution;
  // Cap height sits near 0.7em in most grotesques; centering on half of it
  // keeps the whole line optically centered on the origin whatever the string.
  const verticalCenter = fontSize * 0.35;
  const letters: Letter[] = [];
  let pen = 0;

  Array.from(text).forEach((char, index) => {
    const glyph = font.glyphs[char];
    if (!glyph) {
      // Unknown character: advance by a space so the line does not close up.
      pen += (font.glyphs[" "]?.ha ?? font.resolution * 0.25) * scale + tracking;
      return;
    }

    const advance = glyph.ha * scale;
    const shapes = glyphToShapes(glyph, scale);

    if (shapes.length > 0) {
      const geometry = new ExtrudeGeometry(shapes, {
        depth,
        bevelEnabled: bevel > 0,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelOffset: 0,
        bevelSegments: 3,
        curveSegments: 8,
      });
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      const inkCenter = box ? (box.min.x + box.max.x) / 2 : advance / 2;

      // Re-origin each letter on its own center so the rise can tumble it
      // around itself; the baseline is preserved by the shared verticalCenter.
      geometry.translate(-inkCenter, -verticalCenter, -depth / 2);
      geometry.computeVertexNormals();

      letters.push({ key: `${index}-${char}`, geometry, x: pen + inkCenter });
    }

    pen += advance + tracking;
  });

  return { letters, width: Math.max(0, pen - tracking) };
};

// ----------------------------------------------------------------- font load

type LoadedFont = {
  font: TypefaceData | null;
  /** Releases the delayRender hold. Call only once a frame has drawn with the font. */
  release: () => void;
};

/**
 * Loaded by hand behind `delayRender`, never with a suspending loader: a
 * suspended frame can be captured before the glyphs exist, and an empty frame
 * exits 0 like any other.
 *
 * The hold is released by `<FontReady>` after a frame has actually been drawn,
 * not when the JSON arrives — during a render `ThreeCanvas` only draws on frame
 * changes, so geometry that lands after that draw would never be shown.
 */
const useTypeface = (url: string): LoadedFont => {
  const [font, setFont] = useState<TypefaceData | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const pending = useRef<number | null>(null);

  const release = useCallback(() => {
    const handle = pending.current;
    if (handle === null) return;
    pending.current = null;
    continueRender(handle);
  }, [continueRender]);

  useEffect(() => {
    pending.current = delayRender(`Loading typeface: ${url}`);
    const controller = new AbortController();
    let active = true;

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data: unknown = await response.json();
        if (!isTypeface(data)) {
          throw new Error("not a three.js typeface JSON (no glyphs/resolution)");
        }
        if (active) {
          setFont(data);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        const reason = error instanceof Error ? error.message : String(error);
        cancelRender(
          new Error(
            `TextExtrude3d: could not load the typeface "${url}" (${reason}). ` +
              `Put a three.js typeface JSON in your public/ folder and pass ` +
              `fontUrl={staticFile("your-font.typeface.json")} — convert one at https://gero3.github.io/facetype.js/.`,
          ),
        );
      });

    return () => {
      active = false;
      controller.abort();
      release();
    };
  }, [url, delayRender, cancelRender, release]);

  return { font, release };
};

/** Inside the canvas: draws one frame with the glyphs, then lets the render continue. */
const FontReady: React.FC<{ ready: boolean; onReady: () => void }> = ({ ready, onReady }) => {
  const advance = useThree((state) => state.advance);

  useEffect(() => {
    if (!ready) return;
    advance(performance.now());
    onReady();
  }, [ready, advance, onReady]);

  return null;
};

// --------------------------------------------------------------------- camera

type Vec3 = [number, number, number];

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

/** A lit pool under the line, so the contact shadow has something to fall on. */
const FloorPool: React.FC<{ color: string; y: number }> = ({ color, y }) => {
  const uniforms = useMemo(() => ({ uColor: { value: new Color(color) } }), [color]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, y, 0]}>
      <planeGeometry args={[26, 26]} />
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

// ----------------------------------------------------------------------- shot

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PULL = Easing.inOut(Easing.cubic);

/**
 * Every value is a pure function of the frame, and the whole shot is paced off
 * `durationInFrames` so a 90-frame window and a 300-frame one both read.
 *
 * The camera starts low and close on the first letters and pulls back across
 * the line; a small linear drift runs underneath it, so the last frame is
 * still moving instead of parked on an eased-out hold.
 */
const useShot = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const last = Math.max(2, durationInFrames - 1);

  const drift = interpolate(frame, [0, last], [0, 1], clamp);
  const pull = interpolate(frame, [Math.min(6, last - 1), last * 0.82], [0, 1], {
    ...clamp,
    easing: PULL,
  });

  return {
    drift,
    pull,
    camera: [
      // Close enough to read as a raking hero shot, but never so close that the
      // line is cropped: frame 0 is the poster, the tile and the docs still.
      interpolate(pull, [0, 1], [-0.5, 0.1]) + drift * 0.6,
      interpolate(pull, [0, 1], [-0.28, 0.6]) + drift * 0.18,
      interpolate(pull, [0, 1], [6.6, 7.5]) + drift * 1,
    ] as Vec3,
    target: [interpolate(pull, [0, 1], [-0.18, 0]), interpolate(pull, [0, 1], [-0.06, 0.02]), 0] as Vec3,
    yaw: interpolate(pull, [0, 1], [0.24, 0.05]) - drift * 0.22,
  };
};

/** Per-letter rise, staggered off the frame — never a timer. */
const useLetterRise = (count: number) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // The whole line is up by ~45% of the window, leaving the pull-back to carry
  // the second half. Long strings tighten the stagger rather than overrun it.
  const riseWindow = Math.max(12, durationInFrames * 0.45);
  const stagger = count > 1 ? Math.min(3.5, (riseWindow * 0.55) / (count - 1)) : 0;

  return (index: number) => {
    const progress = spring({
      // The head start matters: a spring is 0 on its first frame, so starting
      // the line at frame 0 would make frame 0 an empty plate — the frame a
      // poster, a thumbnail or a still export is taken from.
      frame: frame + 14 - index * stagger,
      fps,
      config: { damping: 15, stiffness: 110, mass: 0.9 },
    });
    return {
      y: interpolate(progress, [0, 1], [-1.45, 0]),
      rotationX: interpolate(progress, [0, 1], [-1.15, 0]),
      // Fades in over the first quarter of the rise: the letters arrive out of
      // the dark rather than popping into an empty frame.
      opacity: interpolate(progress, [0, 0.28], [0, 1], clamp),
    };
  };
};

// ---------------------------------------------------------------------- scene

const positive = (value: number, fallback: number) =>
  Number.isFinite(value) && value > 0 ? value : fallback;
const within01 = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;

export const TextExtrude3d: React.FC<TextExtrude3dProps> = ({
  text = "MOTION",
  fontUrl,
  fontSize = 1.35,
  tracking = 0.06,
  depth = 0.34,
  bevel = 0.035,
  color = "#eef1f7",
  metalness = 0.55,
  roughness = 0.24,
  backgroundColor = "#06070b",
  glowColor = "#161c2a",
  rimColor = "#6f9dff",
  accentColor = "#ff9c66",
}) => {
  const { width, height } = useVideoConfig();
  const url = fontUrl ?? staticFile(DEFAULT_FONT_URL);
  const { font, release } = useTypeface(url);
  const shot = useShot();

  const size = positive(fontSize, 1.35);
  const space = Number.isFinite(tracking) ? tracking : 0.06;
  const thickness = positive(depth, 0.34);
  const bevelSize = Number.isFinite(bevel) ? Math.max(0, bevel) : 0.035;

  const layout = useMemo(
    () => (font ? layoutText(font, text, size, space, thickness, bevelSize) : EMPTY_LAYOUT),
    [font, text, size, space, thickness, bevelSize],
  );

  useEffect(
    () => () => {
      for (const letter of layout.letters) {
        letter.geometry.dispose();
      }
    },
    [layout],
  );

  const riseOf = useLetterRise(layout.letters.length);
  const floorY = -size * 0.62;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 46%, ${glowColor}, ${backgroundColor} 70%)`,
      }}
    >
      <ThreeCanvas width={width} height={height} camera={{ position: shot.camera, fov: 38 }}>
        <CameraRig position={shot.camera} target={shot.target} />
        <FontReady ready={layout.letters.length > 0} onReady={release} />

        {/* Lightformers build the env map locally; a preset would fetch an HDRI. */}
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={3.4} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[12, 6, 1]} />
          <Lightformer intensity={3} position={[-5, 1, 3]} rotation-y={1.1} scale={[7, 4, 1]} color={rimColor} />
          <Lightformer intensity={2.6} position={[5, 0.5, 2]} rotation-y={-1.1} scale={[7, 4, 1]} color={accentColor} />
          {/* Narrow strip dead ahead: the specular line that rides the bevel. */}
          <Lightformer intensity={4} position={[-1.2, 1.5, 7]} rotation-y={Math.PI} scale={[0.6, 8, 1]} />
        </Environment>
        <ambientLight intensity={0.35} />
        <directionalLight position={[3.5, 5, 4]} intensity={1.1} />
        <directionalLight position={[-4, 1.5, 2]} intensity={0.5} color={rimColor} />

        <FloorPool color="#39415a" y={floorY} />

        <group rotation-y={shot.yaw}>
          {layout.letters.map((letter, index) => {
            const rise = riseOf(index);
            return (
              <mesh
                key={letter.key}
                geometry={letter.geometry}
                position={[letter.x - layout.width / 2, rise.y, 0]}
                rotation-x={rise.rotationX}
              >
                <meshPhysicalMaterial
                  color={color}
                  metalness={within01(metalness, 0.55)}
                  roughness={within01(roughness, 0.24)}
                  envMapIntensity={1.4}
                  clearcoat={0.5}
                  clearcoatRoughness={0.3}
                  transparent
                  opacity={rise.opacity}
                />
              </mesh>
            );
          })}
        </group>

        <ContactShadows
          position={[0, floorY + 0.002, 0]}
          opacity={0.7}
          scale={16}
          blur={2.6}
          far={2.2}
          resolution={1024}
          frames={Infinity}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
