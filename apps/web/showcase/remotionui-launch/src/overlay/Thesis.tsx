import { useEffect, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, interpolate, random, spring } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { FPS, THESIS, type ThesisWord } from "../timeline";
import { COLORS, MONO, SANS, fontsReady } from "../theme";
import { CLAMP, ease } from "../lib/anim";

/**
 * Thesis: the cold open. Two lines of kinetic type.
 *
 * Words land on beats. Each arriving word opens its own width on a spring, so
 * the line re-centres as it grows instead of sitting off-centre with holes in
 * it. The last word of each line decodes out of code glyphs (seeded with
 * `random()`, so every render of a frame is identical) and its full stop lands
 * exactly on the beat.
 */

const TYPE = { size: 128, weight: "600", tracking: "-0.035em", space: 0.26 } as const;
const GLYPHS = "{}[]<>/=+*#$%&_;:0123456789";

type Metrics = { widths: Map<string, number>; space: number };

const measure = (text: string) =>
  measureText({ text, fontFamily: SANS, fontSize: TYPE.size, fontWeight: TYPE.weight, letterSpacing: TYPE.tracking }).width;

const useMetrics = (): Metrics | null => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("Measuring the thesis type"));
  useEffect(() => {
    fontsReady()
      .then(() => {
        const widths = new Map<string, number>();
        [...THESIS.line1, ...THESIS.line2].forEach((w) => widths.set(w.text, measure(w.text)));
        setMetrics({ widths, space: TYPE.size * TYPE.space });
        continueRender(handle);
      })
      .catch((error: unknown) => cancelRender(error instanceof Error ? error : new Error("Font loading failed")));
  }, [handle]);
  return metrics;
};

/** How far a word has opened, 0..1. Decode words open when their churn starts. */
const opened = (frame: number, word: ThesisWord): number => {
  const start = word.decode ? word.at - THESIS.decodeFor : word.at - 4;
  return spring({ frame: frame - start, fps: FPS, config: { damping: 200, stiffness: 220 }, durationInFrames: 9 });
};

const DecodeText: React.FC<{ text: string; frame: number; land: number; seed: string }> = ({ text, frame, land, seed }) => {
  const chars = [...text];
  const start = land - THESIS.decodeFor;
  const tick = Math.floor(frame / 2);
  return (
    <span style={{ whiteSpace: "pre" }}>
      {chars.map((ch, i) => {
        // Characters resolve left to right; the last one (the full stop) on `land`.
        const resolveAt = start + ((i + 1) / chars.length) * THESIS.decodeFor;
        if (frame >= resolveAt) {
          return <span key={i}>{ch}</span>;
        }
        const glyph = GLYPHS[Math.floor(random(`${seed}-${i}-${tick}`) * GLYPHS.length)];
        return (
          <span key={i} style={{ fontFamily: MONO, fontWeight: 500, color: COLORS.phosphor, fontSize: "0.86em" }}>
            {glyph}
          </span>
        );
      })}
    </span>
  );
};

const Word: React.FC<{ word: ThesisWord; frame: number; metrics: Metrics; index: number }> = ({ word, frame, metrics, index }) => {
  const width = metrics.widths.get(word.text) ?? 0;
  const open = opened(frame, word);
  const rise = word.decode
    ? 1
    : spring({ frame: frame - (word.at - 4), fps: FPS, config: { damping: 18, stiffness: 190, mass: 0.7 } });
  const visible = frame >= (word.decode ? word.at - THESIS.decodeFor : word.at - 4);
  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        width: (width + metrics.space) * open,
        height: TYPE.size * 1.2,
        overflow: "visible",
      }}
    >
      {visible ? (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            whiteSpace: "nowrap",
            opacity: interpolate(rise, [0, 0.5], [0, 1], CLAMP),
            transform: `translateY(${(1 - rise) * 40}px)`,
            filter: rise < 0.95 ? `blur(${(1 - rise) * 10}px)` : undefined,
          }}
        >
          {word.decode ? <DecodeText text={word.text} frame={frame} land={word.at} seed={`thesis-${index}`} /> : word.text}
        </span>
      ) : null}
    </span>
  );
};

const Line: React.FC<{ words: ThesisWord[]; frame: number; metrics: Metrics; seed: number; style?: React.CSSProperties }> = ({
  words,
  frame,
  metrics,
  seed,
  style,
}) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", ...style }}>
    <div
      style={{
        display: "flex",
        // The trailing space of the last word is not part of the line.
        marginRight: -metrics.space,
        fontFamily: SANS,
        fontSize: TYPE.size,
        fontWeight: Number(TYPE.weight),
        letterSpacing: TYPE.tracking,
        lineHeight: 1.2,
        color: COLORS.ink,
      }}
    >
      {words.map((w, i) => (
        <Word key={w.text + i} word={w} frame={frame} metrics={metrics} index={seed * 10 + i} />
      ))}
    </div>
  </AbsoluteFill>
);

export const Thesis: React.FC<{ frame: number }> = ({ frame }) => {
  const metrics = useMetrics();
  if (!metrics || frame > THESIS.pushEnd + 2) {
    return null;
  }

  // Line 1 leaves upward, accelerating (ease-in), before line 2 starts.
  const out1 = interpolate(frame, [THESIS.line1Out, THESIS.line1Out + 10], [0, 1], { ...CLAMP, easing: ease.in });

  // Line 2 flies past the camera on the push into the hero.
  const push = interpolate(frame, [THESIS.pushStart, THESIS.pushStart + 16], [0, 1], { ...CLAMP, easing: (t) => t * t });

  return (
    <AbsoluteFill>
      {out1 < 1 ? (
        <Line
          words={THESIS.line1}
          frame={frame}
          metrics={metrics}
          seed={1}
          style={{ opacity: 1 - out1, transform: `translateY(${-out1 * 70}px)`, filter: out1 > 0.02 ? `blur(${out1 * 14}px)` : undefined }}
        />
      ) : null}
      {frame >= THESIS.line2[0].at - 6 ? (
        <Line
          words={THESIS.line2}
          frame={frame}
          metrics={metrics}
          seed={2}
          style={{
            opacity: 1 - interpolate(push, [0.15, 0.75], [0, 1], CLAMP),
            transform: `scale(${1 + push * 2.4})`,
            filter: push > 0.02 ? `blur(${push * 18}px)` : undefined,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
