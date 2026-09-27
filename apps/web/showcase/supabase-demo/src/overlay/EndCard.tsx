import { AbsoluteFill, Img, interpolate, random, spring, staticFile } from "remotion";
import { END, FPS, PULLBACK } from "../timeline";
import { COLORS, SANS } from "../theme";
import { CLAMP, riseIn, settle } from "../lib/anim";

/**
 * EndCard — the official wordmark lands on the impact, then the line, then
 * the credit. From END.creditIn + 16 to the last frame everything is still
 * and legible: a 100+ frame readable hold.
 *
 * The wordmark is the file from Supabase's own brand kit (the "dark" variant,
 * white lettering for dark backgrounds), used unmodified.
 */

const TAGLINE = [
  { text: "Build in a weekend.", color: COLORS.text },
  { text: "Scale to millions.", color: COLORS.green },
];

export const REPO_URL = "github.com/riaz37/remotion-ui";

/** A short, decaying shake on the impact frame. Deterministic. */
export const impactShake = (frame: number): { x: number; y: number } => {
  const t = frame - END.logoIn;
  if (t < 0 || t > 10) {
    return { x: 0, y: 0 };
  }
  const amp = 7 * Math.exp(-t / 3);
  return { x: (random(`sx-${t}`) - 0.5) * 2 * amp, y: (random(`sy-${t}`) - 0.5) * 2 * amp };
};

export const EndCard: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < PULLBACK.pushStart + 20) {
    return null;
  }
  const backdrop = interpolate(frame, [PULLBACK.pushStart + 20, END.logoIn], [0, 1], CLAMP);
  const slam = spring({ frame: frame - END.logoIn, fps: FPS, config: { damping: 11, stiffness: 180, mass: 0.8 } });
  const logoOpacity = interpolate(frame, [END.logoIn - 2, END.logoIn + 3], [0, 1], CLAMP);
  const flash = interpolate(frame, [END.logoIn, END.logoIn + 3, END.logoIn + 40], [0, 1, 0], CLAMP);
  const bloom = interpolate(frame, [END.logoIn, END.logoIn + 50], [0, 1], CLAMP);
  const credit = settle(frame, END.creditIn, 16);

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLORS.text }}>
      <AbsoluteFill style={{ background: "#0A0A0A", opacity: backdrop }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${30 + bloom * 25}% ${30 + bloom * 20}% at 50% 42%, rgba(62,207,142,${0.22 * flash + 0.07}), rgba(0,0,0,0) 70%)`,
          opacity: logoOpacity,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 372,
          display: "flex",
          justifyContent: "center",
          opacity: logoOpacity,
          transform: `scale(${1.28 - 0.28 * slam})`,
          filter: slam < 0.9 ? `blur(${(1 - slam) * 10}px)` : undefined,
        }}
      >
        <Img src={staticFile("supabase-demo/logo/supabase-logo-wordmark--dark.svg")} style={{ width: 660, height: "auto" }} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 574,
          display: "flex",
          justifyContent: "center",
          gap: 18,
          fontSize: 58,
          fontWeight: 600,
          letterSpacing: "-0.03em",
        }}
      >
        {TAGLINE.map((part, i) => (
          <span key={part.text} style={{ color: part.color, display: "inline-block", ...riseIn(settle(frame, END.taglineIn + i * 10, 16), 26) }}>
            {part.text}
          </span>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 92,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          ...riseIn(credit, 14),
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 500, color: COLORS.text }}>
          Made with RemotionUI
          <span style={{ color: COLORS.faint, margin: "0 16px" }}>·</span>
          <span style={{ color: COLORS.muted, fontWeight: 400 }}>{REPO_URL}</span>
        </div>
        <div style={{ fontSize: 21, color: COLORS.faint }}>
          An unofficial tribute. Not affiliated with or endorsed by Supabase.
        </div>
      </div>
    </AbsoluteFill>
  );
};
