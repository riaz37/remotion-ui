import { AbsoluteFill, Img, interpolate, random, Sequence, spring } from "remotion";
import { Counter } from "@/remotion/primitives/counter";
import { END, FPS, REVEAL } from "../timeline";
import { GALLERY_RECTS, captureSrc, centre } from "../captures";
import { COMPONENT_COUNT } from "../facts";
import { COLORS, MONO, SANS } from "../theme";
import { CLAMP, ease, lerp } from "../lib/anim";

/**
 * Reveal: the count, the line, and the real gallery page.
 *
 * All screen space, over the wall. The gallery capture rises into the
 * foreground (the wall falls out of focus behind it), a ring finds its "210
 * installable components" line, and the camera pushes into its logo, which the
 * end card's mark then takes over from (see `galleryLogoOnScreen`).
 */

/* --------------------------------------------------------- gallery geometry */

/**
 * At rest the page is a macro shot: scale 1.6 (under the 2× capture ceiling)
 * with its "210 installable components" paragraph held at screen `focus`.
 */
const REST = {
  s: 1.6,
  /** The opening words of the paragraph, "210 installable components". */
  focus: { x: GALLERY_RECTS.count.x + 200, y: GALLERY_RECTS.count.y + 30 },
  at: { x: 820, y: 470 },
} as const;
/** Screen point the end card's mark lands on; the push carries the logo there. */
export const END_MARK = { x: 960, y: 322 } as const;
/** Ceiling on the gallery's scale: 2 is 1:1 with its 2× capture pixels. */
const PUSH_MAX_S = 2;

const LOGO = centre(GALLERY_RECTS.logoMark);

type GalleryShot = { tx: number; ty: number; s: number; tilt: number };

export const galleryShot = (frame: number): GalleryShot => {
  const rise = spring({ frame: frame - REVEAL.galleryStart, fps: FPS, config: { damping: 200, stiffness: 70 }, durationInFrames: REVEAL.galleryEnd - REVEAL.galleryStart });
  const push = interpolate(frame, [REVEAL.pushStart, REVEAL.pushEnd], [0, 1], { ...CLAMP, easing: ease.inOut });
  const s = Math.exp(lerp(Math.log(REST.s), Math.log(PUSH_MAX_S), push));
  const restLogo = { x: REST.at.x + (LOGO.x - REST.focus.x) * REST.s, y: REST.at.y + (LOGO.y - REST.focus.y) * REST.s };
  const logo = { x: lerp(restLogo.x, END_MARK.x, push), y: lerp(restLogo.y, END_MARK.y, push) };
  return {
    tx: logo.x - LOGO.x * s,
    ty: logo.y - LOGO.y * s + (1 - rise) * 820,
    s,
    // Flat before the end card's mark takes over, so the two logos coincide exactly.
    tilt: 1 - interpolate(frame, [REVEAL.pushStart, REVEAL.pushStart + 12], [0, 1], { ...CLAMP, easing: ease.inOut }),
  };
};

/** Where the gallery's logo mark is on screen, and how big. */
export const galleryLogoOnScreen = (frame: number): { x: number; y: number; size: number } => {
  const g = galleryShot(frame);
  return { x: g.tx + LOGO.x * g.s, y: g.ty + LOGO.y * g.s, size: GALLERY_RECTS.logoMark.w * g.s };
};

const Gallery: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < REVEAL.galleryStart || frame > END.impact + 2) {
    return null;
  }
  const g = galleryShot(frame);
  const ring = interpolate(frame, [REVEAL.ringIn, REVEAL.ringIn + 8], [0, 1], { ...CLAMP, easing: ease.out });
  const fade = interpolate(frame, [END.impact - 14, END.impact], [1, 0], CLAMP);
  const count = GALLERY_RECTS.count;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transformOrigin: "0 0",
          transform: `translate(${g.tx}px, ${g.ty}px) scale(${g.s})`,
        }}
      >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `perspective(2400px) rotateX(${5 * g.tilt}deg) rotateY(${-6 * g.tilt}deg)`,
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 80px 180px rgba(0,0,0,0.8), 0 0 0 1px rgba(236,236,236,0.08)",
          opacity: fade,
          filter: fade < 0.99 ? `blur(${(1 - fade) * 6}px)` : undefined,
        }}
      >
        <Img src={captureSrc("gallery")} style={{ width: 1920, height: 1080 }} />
        <div
          style={{
            position: "absolute",
            left: count.x - 14,
            top: count.y - 10,
            width: count.w + 28,
            height: count.h + 20,
            borderRadius: 12,
            border: `3px solid rgba(${COLORS.phosphorRgb},${0.9 * ring})`,
            boxShadow: `0 0 ${40 * ring}px rgba(${COLORS.phosphorRgb},${0.25 * ring})`,
            transform: `scale(${1.04 - 0.04 * ring})`,
          }}
        />
      </div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- count + line */

const LINE = [
  { text: "This", at: 795 },
  { text: "film", at: 799 },
  { text: "is", at: 802 },
  { text: "made", at: 805 },
  { text: "of", at: 807 },
  { text: "them.", at: REVEAL.lineLand, decode: true },
];
const GLYPHS = "{}[]<>/=+*#$%&_;:0123456789";
const DECODE_FOR = 10;

const LineWord: React.FC<{ word: (typeof LINE)[number]; frame: number; seed: number }> = ({ word, frame, seed }) => {
  const start = word.decode ? word.at - DECODE_FOR : word.at - 3;
  if (frame < start) {
    return <span style={{ opacity: 0 }}>{word.text}</span>;
  }
  const p = spring({ frame: frame - start, fps: FPS, config: { damping: 18, stiffness: 190, mass: 0.7 } });
  const chars = [...word.text];
  const tick = Math.floor(frame / 2);
  return (
    <span style={{ display: "inline-block", opacity: interpolate(p, [0, 0.5], [0, 1], CLAMP), transform: `translateY(${(1 - p) * 30}px)` }}>
      {word.decode
        ? chars.map((ch, i) =>
            frame >= start + ((i + 1) / chars.length) * DECODE_FOR ? (
              <span key={i}>{ch}</span>
            ) : (
              <span key={i} style={{ fontFamily: MONO, color: COLORS.phosphor, fontSize: "0.86em" }}>
                {GLYPHS[Math.floor(random(`line-${seed}-${i}-${tick}`) * GLYPHS.length)]}
              </span>
            ),
          )
        : word.text}
    </span>
  );
};

export const Reveal: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < REVEAL.stop || frame > END.impact + 2) {
    return null;
  }
  const scrim = interpolate(frame, [REVEAL.countStart, REVEAL.countStart + 14, REVEAL.lineOut, REVEAL.lineOut + 14], [0, 1, 1, 0.3], CLAMP);
  const countIn = interpolate(frame, [REVEAL.countStart, REVEAL.countStart + 8], [0, 1], CLAMP);
  const countOut = interpolate(frame, [REVEAL.countOut, REVEAL.countOut + 8], [0, 1], { ...CLAMP, easing: ease.in });
  const lineOut = interpolate(frame, [REVEAL.lineOut, REVEAL.lineOut + 10], [0, 1], { ...CLAMP, easing: ease.in });
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{ background: `radial-gradient(ellipse 55% 50% at 50% 50%, rgba(5,5,5,${0.82 * scrim}), rgba(5,5,5,${0.35 * scrim}) 100%)` }}
      />
      {frame < REVEAL.countOut + 10 ? (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 8,
            opacity: countIn * (1 - countOut),
            transform: `translateY(${-countOut * 50}px)`,
            filter: countOut > 0.02 ? `blur(${countOut * 12}px)` : undefined,
          }}
        >
          <Sequence from={REVEAL.countStart} layout="none">
            <Counter to={COMPONENT_COUNT} durationInFrames={REVEAL.countEnd - REVEAL.countStart} fontSize={300} fontWeight={700} fontFamily={SANS} color={COLORS.ink} style={{ letterSpacing: "-0.04em" }} />
          </Sequence>
          <div style={{ fontFamily: SANS, fontSize: 56, fontWeight: 500, color: COLORS.muted, letterSpacing: "-0.01em" }}>components</div>
        </AbsoluteFill>
      ) : null}
      {frame >= LINE[0].at - 4 && frame < REVEAL.lineOut + 12 ? (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: 1 - lineOut,
            transform: `translateY(${-lineOut * 60}px)`,
            filter: lineOut > 0.02 ? `blur(${lineOut * 12}px)` : undefined,
          }}
        >
          <div style={{ display: "flex", gap: "0.26em", fontFamily: SANS, fontSize: 116, fontWeight: 600, letterSpacing: "-0.035em", color: COLORS.ink }}>
            {LINE.map((w, i) => (
              <LineWord key={w.text} word={w} frame={frame} seed={i} />
            ))}
          </div>
        </AbsoluteFill>
      ) : null}
      <Gallery frame={frame} />
    </AbsoluteFill>
  );
};
