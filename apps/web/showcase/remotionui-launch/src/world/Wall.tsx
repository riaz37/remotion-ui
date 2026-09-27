import { Img, interpolate, staticFile } from "remotion";
import { REVEAL } from "../timeline";
import { CARD, FAN_CENTRE, WALL } from "../camera/shots";
import { COMPONENT_SLUGS, MISSING_POSTERS } from "../facts";
import { CLAMP, ease } from "../lib/anim";
import { SLOTS } from "../montage/slots";

/**
 * Wall: the whole registry, one tile per component, around the montage card.
 *
 * Tiles are the real posters from public/previews (the ones the docs and the
 * gallery use); the 20 components without one use a still rendered from their
 * docs preview (public/remotionui-launch/tiles). The montage's components sit
 * nearest the centre, so the pull-back reads as "those were tiles in this".
 * Tiles ripple in outward from the centre on the hard stop, and fall out of
 * focus with distance (depth of field).
 */

const MISSING = new Set<string>(MISSING_POSTERS);
const pitchX = CARD.w + WALL.gap;
const pitchY = CARD.h + WALL.gap;

export const tileSrc = (slug: string): string =>
  MISSING.has(slug) ? staticFile(`remotionui-launch/tiles/${slug}.jpg`) : staticFile(`previews/${slug}.webp`);

type Tile = { slug: string; dc: number; dr: number; dist: number };

/** Cells sorted by distance from the centre; the montage slugs (and intro) claim the nearest. */
const TILES: Tile[] = (() => {
  const cells: Omit<Tile, "slug">[] = [];
  for (let r = 0; r < WALL.rows; r += 1) {
    for (let c = 0; c < WALL.cols; c += 1) {
      const dc = c - WALL.centreCol;
      const dr = r - WALL.centreRow;
      cells.push({ dc, dr, dist: Math.hypot(dc, dr * 1.1) });
    }
  }
  cells.sort((a, b) => a.dist - b.dist || a.dr - b.dr || a.dc - b.dc);
  const featured = [...SLOTS.map((s) => s.slug).reverse(), "intro"];
  const rest = COMPONENT_SLUGS.filter((s) => !featured.includes(s));
  const order = [...featured, ...rest];
  return cells.slice(0, order.length).map((cell, i) => ({ ...cell, slug: order[i] }));
})();

/** Tiles further than this from the centre are never on screen, so they are not drawn. */
const CULL = { cols: 5, rows: 4 } as const;

export const Wall: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < REVEAL.stop) {
    return null;
  }
  return (
    <div style={{ position: "absolute", left: 0, top: 0 }}>
      {TILES.map((tile) => {
        // The centre cell is the montage card itself.
        if (tile.dc === 0 && tile.dr === 0) {
          return null;
        }
        if (Math.abs(tile.dc) > CULL.cols || Math.abs(tile.dr) > CULL.rows) {
          return null;
        }
        const at = REVEAL.stop + 2 + tile.dist * 3.2;
        const inP = interpolate(frame, [at, at + 12], [0, 1], { ...CLAMP, easing: ease.out });
        const x = FAN_CENTRE.x + tile.dc * pitchX;
        const y = FAN_CENTRE.y + tile.dr * pitchY;
        const blur = Math.max(0, tile.dist - 1.6) * 5;
        return (
          <div
            key={tile.slug}
            style={{
              position: "absolute",
              left: x - CARD.w / 2,
              top: y - CARD.h / 2,
              width: CARD.w,
              height: CARD.h,
              borderRadius: CARD.radius,
              overflow: "hidden",
              opacity: inP * interpolate(tile.dist, [1, 5.5], [1, 0.45], CLAMP),
              transform: `scale(${0.9 + 0.1 * inP})`,
              filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined,
              boxShadow: "0 0 0 2px rgba(236,236,236,0.08)",
              background: "#07070a",
            }}
          >
            <Img src={tileSrc(tile.slug)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}
    </div>
  );
};
