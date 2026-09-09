import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadDisplay } from "@remotion/google-fonts/SourceSerif4";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";
import { CAPTIONS, END_CARD, TIME_CUTS, type Caption } from "./timeline";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

/**
 * The app's own display face is `Iowan Old Style, Palatino, ...` — an old-style
 * serif. The end card is the product's name, so it is set in the nearest thing
 * on Google Fonts rather than in the UI sans everything else uses.
 */
const { fontFamily: displayFamily } = loadDisplay("normal", {
  weights: ["400", "600"],
  subsets: ["latin"],
});

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const ACCENT = "#E8B86D";
const FADE = 10;

/**
 * captions — the words, which sit outside the camera.
 *
 * The camera moves over the interface; the captions do not move with it. They
 * are the film's own voice, so they hold still in the frame and say only what
 * the shot underneath is doing.
 */

const useWindow = (span: Caption, frame: number) =>
  interpolate(
    frame,
    [span.start, span.start + FADE, span.end - FADE, span.end],
    [0, 1, 1, 0],
    { ...clamp, easing: EASING.editorial },
  );

const Line: React.FC<{ span: Caption; frame: number }> = ({ span, frame }) => {
  const opacity = useWindow(span, frame);
  if (opacity <= 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        // Clear of the app's sidebar footer. At the zooms these captions land
        // on, `bottom: 72` sits straight across Brand kit / Agent CLI / Sign
        // out, and a caption reading through a menu reads as an accident.
        bottom: 150,
        opacity,
        transform: `translateY(${interpolate(opacity, [0, 1], [8, 0])}px)`,
        // The camera is often deep in the interface by the time a caption
        // lands, so the line carries its own plate rather than trusting
        // whatever pixels happen to be under it.
        padding: "14px 22px",
        borderRadius: 10,
        background: "rgba(6,5,4,0.92)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.09)",
        fontFamily,
        fontSize: 30,
        fontWeight: 500,
        letterSpacing: -0.2,
        color: "#F2EEE8",
      }}
    >
      {span.text}
    </div>
  );
};

/**
 * The wait, named. A generate runs for minutes and a refine for tens of
 * seconds; the film cuts that time and says so rather than showing a spinner
 * spun faster than it ever turned.
 */
const TimeCut: React.FC<{ span: Caption; frame: number }> = ({ span, frame }) => {
  const opacity = useWindow(span, frame);
  if (opacity <= 0) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        // Near-opaque on purpose: the cut to the next still happens behind this
        // plate, so two different layouts never cross-dissolve in the open.
        background: `rgba(6,5,4,${opacity * 0.97})`,
      }}
    >
      <div
        style={{
          opacity,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 26,
          letterSpacing: 2.6,
          textTransform: "uppercase",
          color: ACCENT,
        }}
      >
        {span.text}
      </div>
    </AbsoluteFill>
  );
};

/**
 * The end card. Two ramps, not one: the plate reaches full black first, and
 * only then does the type arrive. Fading both together prints display type at
 * 50% over the live Changed card, and neither is legible while it happens.
 */
const EndCard: React.FC<{ frame: number }> = ({ frame }) => {
  const plate = interpolate(
    frame,
    [END_CARD.start, END_CARD.start + END_CARD.plate],
    [0, 1],
    { ...clamp, easing: EASING.editorial },
  );
  if (plate <= 0) {
    return null;
  }

  const typeIn = interpolate(
    frame,
    [END_CARD.start + END_CARD.plate, END_CARD.start + END_CARD.plate + END_CARD.type],
    [0, 1],
    { ...clamp, easing: EASING.editorial },
  );
  const rise = interpolate(typeIn, [0, 1], [14, 0]);

  return (
    <AbsoluteFill
      style={{
        background: `rgba(7,6,5,${plate})`,
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        fontFamily,
      }}
    >
      <div
        style={{
          opacity: typeIn,
          transform: `translateY(${rise}px)`,
          fontFamily: displayFamily,
          fontSize: 88,
          fontWeight: 600,
          letterSpacing: -1,
          color: "#F5F1EA",
        }}
      >
        Kine
      </div>
      <div
        style={{
          opacity: typeIn,
          transform: `translateY(${rise}px)`,
          fontSize: 30,
          color: "rgba(245,241,234,0.62)",
        }}
      >
        Point at the thing. Say what to change.
      </div>
      {/* The only thing to do after watching this: the route is app/kine. */}
      <div
        style={{
          opacity: typeIn,
          transform: `translateY(${rise}px)`,
          marginTop: 10,
          padding: "12px 26px",
          borderRadius: 999,
          border: `1px solid ${ACCENT}`,
          fontSize: 28,
          letterSpacing: 0.2,
          color: ACCENT,
        }}
      >
        remotionui.com/kine
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {CAPTIONS.map((span) => (
        <Line key={span.text} span={span} frame={frame} />
      ))}
      {TIME_CUTS.map((span) => (
        <TimeCut key={span.text} span={span} frame={frame} />
      ))}
      <EndCard frame={frame} />
    </AbsoluteFill>
  );
};
