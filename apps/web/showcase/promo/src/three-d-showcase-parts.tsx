import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { RemotionUIMark } from "./remotionui-mark";

/**
 * Building blocks for `three-d-showcase.tsx`: the hook, the caption that sits
 * over each live 3D beat, the five-up grid and the end card. The 3D scenes
 * themselves are the registry components, untouched.
 */

const { fontFamily: inter } = loadInter("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export const COLORS = {
  stage: "#050505",
  ink: "#F4F4F5",
  muted: "#A1A1AA",
  accent: "#E8B86D",
  edge: "rgba(255,255,255,0.08)",
} as const;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Fade + rise driven by a spring that starts `delay` frames into the scene. */
const useRise = (delay: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, stiffness: 120 },
  });
  return {
    opacity: progress,
    transform: `translateY(${interpolate(progress, [0, 1], [24, 0])}px)`,
  };
};

/**
 * Plays a scene from `offset` frames into its own timeline. The inner
 * Sequence's duration is the window the scene paces its camera against, so
 * the beat's last frame is the scene's last frame.
 */
export const OffsetScene: React.FC<{
  offset: number;
  length: number;
  width?: number;
  height?: number;
  children: React.ReactNode;
}> = ({ offset, length, width, height, children }) => (
  <Sequence
    from={-offset}
    durationInFrames={length + offset}
    width={width}
    height={height}
    name="3d-scene"
  >
    {children}
  </Sequence>
);

/**
 * The 3D scenes frame their cameras for landscape; in a square box a wide
 * subject (the laptop, the fanned deck) runs off the sides. `aspect > 1`
 * renders the scene on a wider virtual canvas, scales it to the box width and
 * feathers its top and bottom edges into the stage, so nothing is cropped.
 * `lift` moves the letterboxed scene up to leave room for a caption.
 */
export const FramedScene: React.FC<{
  box: { width: number; height: number };
  aspect: number;
  lift?: number;
  offset: number;
  length: number;
  children: React.ReactNode;
}> = ({ box, aspect, lift = 0, offset, length, children }) => {
  const ratio = Math.max(1, aspect);
  const width = Math.round(box.width * ratio);
  const height = box.height;
  const scale = box.width / width;
  const shown = height * scale;
  const top = Math.max(0, (box.height - shown) / 2 - lift);
  const feather =
    ratio > 1
      ? "linear-gradient(to bottom, transparent 0%, black 10%, black 88%, transparent 100%)"
      : undefined;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top,
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          maskImage: feather,
          WebkitMaskImage: feather,
        }}
      >
        <OffsetScene offset={offset} length={length} width={width} height={height}>
          {children}
        </OffsetScene>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------- hook

export const Hook: React.FC = () => {
  const { width } = useVideoConfig();
  // Frame 0 is the thumbnail: the kicker and first line are already up, only
  // the payoff line rises in.
  const kicker = useRise(-30);
  const line1 = useRise(-30);
  const line2 = useRise(8);
  const headline = Math.round(width * 0.094);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.stage,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: inter,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 55%, ${COLORS.accent}22, transparent 55%)`,
        }}
      />
      <div style={{ textAlign: "center", position: "relative" }}>
        <div
          style={{
            ...kicker,
            fontFamily: mono,
            fontSize: Math.round(width * 0.03),
            color: COLORS.muted,
            marginBottom: Math.round(width * 0.045),
          }}
        >
          5 components · @remotion/three
        </div>
        <div
          style={{
            ...line1,
            fontSize: headline,
            fontWeight: 600,
            color: COLORS.ink,
            letterSpacing: -2,
            lineHeight: 1.1,
          }}
        >
          3D in Remotion.
        </div>
        <div
          style={{
            ...line2,
            fontSize: headline,
            fontWeight: 600,
            color: COLORS.accent,
            letterSpacing: -2,
            lineHeight: 1.1,
          }}
        >
          Copy, paste, render.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------- caption

export type BeatInfo = {
  slug: string;
  descriptor: string;
  index: number;
  total: number;
};

/** Counter top-left, descriptor + install command on a scrim at the foot. */
export const BeatCaption: React.FC<BeatInfo> = ({
  slug,
  descriptor,
  index,
  total,
}) => {
  const { width } = useVideoConfig();
  const counter = useRise(4);
  const title = useRise(8);
  const command = useRise(16);
  const pad = Math.round(width * 0.06);

  return (
    <AbsoluteFill style={{ fontFamily: inter, pointerEvents: "none" }}>
      <div
        style={{
          ...counter,
          position: "absolute",
          top: pad,
          left: pad,
          fontFamily: mono,
          fontSize: Math.round(width * 0.026),
          color: COLORS.muted,
        }}
      >
        {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: `${pad * 2}px ${pad}px ${pad}px`,
          background:
            "linear-gradient(to top, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.7) 55%, rgba(5,5,5,0) 100%)",
        }}
      >
        <div
          style={{
            ...title,
            fontSize: Math.round(width * 0.05),
            fontWeight: 600,
            color: COLORS.ink,
            letterSpacing: -1,
            marginBottom: Math.round(width * 0.02),
          }}
        >
          {descriptor}
        </div>
        <div
          style={{
            ...command,
            fontFamily: mono,
            fontSize: Math.round(width * 0.0265),
            color: COLORS.muted,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: COLORS.accent }}>$</span> npx shadcn add
          @remotionui/<span style={{ color: COLORS.accent }}>{slug}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------- grid

export type GridTile = {
  slug: string;
  offset: number;
  /** Virtual canvas width / height; see `FramedScene`. */
  aspect: number;
  render: () => React.ReactNode;
};

const TILE_GAP = 8;

const Tile: React.FC<{
  tile: GridTile;
  x: number;
  y: number;
  size: number;
  length: number;
  delay: number;
}> = ({ tile, x, y, size, length, delay }) => {
  const style = useRise(delay);
  const inner = size - TILE_GAP * 2;
  return (
    <div
      style={{
        ...style,
        position: "absolute",
        left: x + TILE_GAP,
        top: y + TILE_GAP,
        width: inner,
        height: inner,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: `0 0 0 1px ${COLORS.edge}`,
      }}
    >
      <FramedScene
        box={{ width: inner, height: inner }}
        aspect={tile.aspect}
        offset={tile.offset}
        length={length}
      >
        {tile.render()}
      </FramedScene>
      <div
        style={{
          position: "absolute",
          left: 14,
          bottom: 12,
          padding: "5px 10px",
          borderRadius: 8,
          background: "rgba(5,5,5,0.72)",
          fontFamily: mono,
          fontSize: size > 400 ? 24 : 19,
          color: COLORS.ink,
        }}
      >
        {tile.slug}
      </div>
    </div>
  );
};

/** Headline band, three tiles across, two larger tiles below. */
export const Grid: React.FC<{ tiles: GridTile[]; length: number }> = ({
  tiles,
  length,
}) => {
  const { width } = useVideoConfig();
  const headline = useRise(2);
  const band = Math.round(width / 6);
  const small = width / 3;
  const large = width / 2;
  const slots = [
    { x: 0, y: band, size: small },
    { x: small, y: band, size: small },
    { x: small * 2, y: band, size: small },
    { x: 0, y: band + small, size: large },
    { x: large, y: band + small, size: large },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.stage }}>
      <div
        style={{
          ...headline,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: band,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: inter,
          fontWeight: 600,
          fontSize: Math.round(width * 0.052),
          letterSpacing: -1,
          color: COLORS.ink,
        }}
      >
        Five 3D scenes.&nbsp;
        <span style={{ color: COLORS.accent }}>Yours to edit.</span>
      </div>
      {tiles.slice(0, slots.length).map((tile, i) => (
        <Tile
          key={tile.slug}
          tile={tile}
          length={length}
          delay={4 + i * 3}
          {...slots[i]}
        />
      ))}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ end card

export const EndCard: React.FC<{ url: string; handle: string }> = ({
  url,
  handle,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const tagline = useRise(34);
  const urlIn = interpolate(frame, [40, 56], [0, 1], clamp);
  const handleIn = interpolate(frame, [48, 64], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.stage, fontFamily: inter }}>
      <RemotionUIMark backgroundColor={COLORS.stage} />
      <div
        style={{
          ...tagline,
          position: "absolute",
          left: 0,
          right: 0,
          top: height / 2 - Math.round(width * 0.24),
          textAlign: "center",
          fontWeight: 500,
          fontSize: Math.round(width * 0.036),
          color: COLORS.muted,
        }}
      >
        Copy-paste motion components for Remotion
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: height / 2 + Math.round(width * 0.12),
          textAlign: "center",
          fontWeight: 600,
          fontSize: Math.round(width * 0.048),
          color: COLORS.accent,
          opacity: urlIn,
        }}
      >
        {url}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: height / 2 + Math.round(width * 0.2),
          textAlign: "center",
          fontFamily: mono,
          fontSize: Math.round(width * 0.032),
          color: COLORS.muted,
          opacity: handleIn,
        }}
      >
        {handle}
      </div>
    </AbsoluteFill>
  );
};
