import { measureText } from "@remotion/layout-utils";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";

export type InfiniteMarqueeProps = {
  text: string;
  /** Pixels travelled per frame. */
  speed?: number;
  /** Which way the text travels. */
  direction?: "left" | "right";
  /**
   * Width of the fade at each edge, as a fraction of the visible band. Text cut
   * dead at the edge reads as clipped; a fade reads as text passing through.
   * Set to 0 for a hard edge.
   */
  fade?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  fontFamily?: string;
  /** Space between one copy of the text and the next, in px. */
  gap?: number;
};

/** Copies beyond the ones needed to fill the band, so a wrap is never bare. */
const SPARE_COPIES = 2;
const DEFAULT_FADE = 0.08;
/** Past this the two fades meet and the middle of the band goes translucent. */
const MAX_FADE = 0.45;

function getTextWidth(
  text: string,
  fontSize: number,
  fontWeight: number,
  fontFamily?: string,
) {
  const family = fontFamily ?? "system-ui";

  if (typeof document !== "undefined") {
    return measureText({
      text,
      fontFamily: family,
      fontSize,
      fontWeight: String(fontWeight),
    }).width;
  }

  return text.length * fontSize * 0.55;
}

/**
 * Text that scrolls forever.
 *
 * The whole job is the wrap, and the wrap is a geometry problem rather than an
 * animation one. The track holds identical copies of the text, each carrying
 * its own trailing gap, so every copy is exactly the same width — one tile.
 * Shifting the track by one tile therefore lands each copy precisely where its
 * neighbour stood, which is the same picture. The shift is written as a
 * percentage of the track, so that identity holds off the measured text width
 * entirely: a bad measurement makes the loop slightly fast or slow and can
 * never make it jump.
 *
 * Measuring the tile in pixels and shifting by that many, or shifting half a
 * track that was laid out with gaps only *between* copies, both leave the wrap
 * a fraction of a gap short — a hitch once per loop, on every loop.
 */
export const InfiniteMarquee: React.FC<InfiniteMarqueeProps> = ({
  text,
  speed = 2,
  direction = "left",
  fade = DEFAULT_FADE,
  fontSize: fontSizeProp,
  color = "#f4f4f5",
  fontWeight = 600,
  fontFamily,
  gap = 48,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(56, width);

  const tileWidth =
    getTextWidth(text, fontSize, fontWeight, fontFamily) + Math.max(0, gap);
  const copies = Math.ceil(width / tileWidth) + SPARE_COPIES;

  /* One tile is one loop — the shortest seamless cycle there is. The measured
   * width sets only how many frames that takes. */
  const framesPerTile = Math.max(1, tileWidth / Math.max(0.01, Math.abs(speed)));
  /* Frames run negative inside a Sequence placed before its parent's start, and
   * a negative remainder would run the track backwards for those frames. */
  const phase =
    (((frame % framesPerTile) + framesPerTile) % framesPerTile) / framesPerTile;
  const tilePercent = 100 / copies;
  /* Travelling right starts a tile further left, so the track still covers the
   * band at the far end of the cycle. */
  const offset = direction === "left" ? -phase : phase - 1;

  const edge = Math.max(0, Math.min(MAX_FADE, fade));
  const mask =
    edge > 0
      ? `linear-gradient(to right, transparent 0%, #000 ${edge * 100}%, #000 ${
          (1 - edge) * 100
        }%, transparent 100%)`
      : undefined;

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      {/* The mask sits on its own layer rather than on the clipping box: giving
          one element the clip, the mask and a moving child leaves a smear of
          the previous frame along the masked edges. */}
      <div
        style={{
          maskImage: mask,
          WebkitMaskImage: mask,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "max-content",
            whiteSpace: "nowrap",
            translate: `${offset * tilePercent}% 0`,
            fontSize,
            fontWeight,
            color,
            lineHeight: 1.2,
            ...(fontFamily ? { fontFamily } : {}),
          }}
        >
          {Array.from({ length: copies }, (_, index) => (
            /* The gap rides on each copy rather than sitting between copies, so
               every copy is exactly one tile wide and the track divides evenly. */
            <span key={index} style={{ marginRight: gap }}>
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
