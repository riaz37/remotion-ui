import { AbsoluteFill, interpolate, random, Sequence, spring } from "remotion";
import { Typewriter } from "@/remotion/primitives/typewriter";
import { END, FPS, REVEAL } from "../timeline";
import { END_COMMAND, SITE, TAGLINE } from "../facts";
import { COLORS, MONO, SANS } from "../theme";
import { CLAMP, ease, lerp, riseIn, settle } from "../lib/anim";
import { Mark } from "./Mark";
import { END_MARK, galleryLogoOnScreen } from "./Reveal";

/**
 * EndCard: the mark lands on the impact, then one line, the command, the URL.
 *
 * The mark is not a new object: from TAKEOVER it is drawn exactly over the
 * gallery capture's own logo as the push carries it to the centre, then it
 * accelerates into the impact at END.impact. Everything is in and still by
 * ~f950 and holds to the end; the last second is silent (see audio/cues.ts).
 */

const MARK_SIZE = 168;
/** After the gallery has flattened (REVEAL.pushStart + 12), so the mark lands exactly on its logo. */
const TAKEOVER = REVEAL.pushStart + 14;

/** A short, decaying shake on the impact. Deterministic. */
export const impactShake = (frame: number): { x: number; y: number } => {
  const t = frame - END.impact;
  if (t < 0 || t > 10) {
    return { x: 0, y: 0 };
  }
  const amp = 6 * Math.exp(-t / 3);
  return { x: (random(`sx-${t}`) - 0.5) * 2 * amp, y: (random(`sy-${t}`) - 0.5) * 2 * amp };
};

const markAt = (frame: number): { x: number; y: number; size: number } => {
  if (frame < END.impact) {
    const g = galleryLogoOnScreen(frame);
    // Last 10 frames before the hit: accelerate up past full size.
    const grow = interpolate(frame, [END.impact - 10, END.impact], [0, 1], { ...CLAMP, easing: ease.in });
    return { x: g.x, y: g.y, size: lerp(g.size, MARK_SIZE * 1.3, grow) };
  }
  const slam = spring({ frame: frame - END.impact, fps: FPS, config: { damping: 11, stiffness: 190, mass: 0.8 } });
  return { x: END_MARK.x, y: END_MARK.y, size: MARK_SIZE * lerp(1.3, 1, slam) };
};

export const EndCard: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < TAKEOVER) {
    return null;
  }
  const backdrop = interpolate(frame, [TAKEOVER + 4, END.impact], [0, 1], { ...CLAMP, easing: ease.in });
  const flash = interpolate(frame, [END.impact, END.impact + 3, END.impact + 40], [0, 1, 0], CLAMP);
  const bloom = interpolate(frame, [END.impact, END.impact + 50], [0, 1], CLAMP);
  const mark = markAt(frame);
  const word = spring({ frame: frame - END.impact, fps: FPS, config: { damping: 16, stiffness: 160 } });
  const tagline = settle(frame, END.taglineIn, 16);
  const cta = settle(frame, END.ctaIn, 14);
  const url = settle(frame, END.urlIn, 16);

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLORS.ink }}>
      <AbsoluteFill style={{ background: COLORS.stage, opacity: backdrop }} />
      {frame >= END.impact ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse ${28 + bloom * 22}% ${30 + bloom * 18}% at 50% 34%, rgba(${COLORS.phosphorRgb},${0.2 * flash + 0.06}), rgba(0,0,0,0) 70%)`,
          }}
        />
      ) : null}

      <div style={{ position: "absolute", left: mark.x - mark.size / 2, top: mark.y - mark.size / 2 }}>
        <Mark size={mark.size} glow={frame >= END.impact ? 0.4 + flash * 0.6 : 0} />
      </div>

      {frame >= END.impact ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 438,
              textAlign: "center",
              fontSize: 112,
              fontWeight: 600,
              letterSpacing: "-0.035em",
              lineHeight: 1,
              opacity: interpolate(word, [0, 0.4], [0, 1], CLAMP),
              transform: `scale(${1.12 - 0.12 * word})`,
              filter: word < 0.9 ? `blur(${(1 - word) * 10}px)` : undefined,
            }}
          >
            RemotionUI
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 588,
              textAlign: "center",
              fontSize: 50,
              fontWeight: 500,
              letterSpacing: "-0.015em",
              color: COLORS.muted,
              ...riseIn(tagline, 22),
            }}
          >
            {TAGLINE}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 700, display: "flex", justifyContent: "center", ...riseIn(cta, 18) }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "20px 34px",
                borderRadius: 16,
                border: `1.5px solid ${COLORS.hairline}`,
                background: "rgba(236,236,236,0.035)",
                fontFamily: MONO,
                fontSize: 46,
              }}
            >
              <span style={{ color: COLORS.phosphor }}>$</span>
              <Sequence from={END.ctaIn} layout="none">
                <Typewriter
                  text={END_COMMAND}
                  durationInFrames={18}
                  fontSize={46}
                  fontWeight={500}
                  fontFamily={MONO}
                  color={COLORS.ink}
                  cursorColor={COLORS.phosphor}
                />
              </Sequence>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 858,
              textAlign: "center",
              fontSize: 40,
              fontWeight: 500,
              letterSpacing: "0.005em",
              color: COLORS.ink,
              ...riseIn(url, 16),
            }}
          >
            {SITE}
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
