"use client";

import { useEffect, useState } from "react";
import { AbsoluteFill, Easing, useDelayRender } from "remotion";
import { loadFont as loadMarqueeFont } from "@remotion/google-fonts/Inter";
import {
  BlurFocusIn,
  InfiniteMarquee,
  LightSweepText,
  MaskedSlideReveal,
  MatrixDecode,
  PerspectiveMarquee,
  RgbGlitchText,
  SlotRoll,
  StaggeredFadeUp,
  TrackingIn,
} from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, PreviewGhostStack, PreviewKicker } from "./preview-frame";

const sample = DEMO_COPY.productLaunch.featureTitle;
const sub = DEMO_COPY.tutorial.calloutSubtitle;

/**
 * The marquee measures its own type to derive a loop period, so it needs a real
 * font — see `PerspectiveMarqueePreview` below.
 */
const marqueeFont = loadMarqueeFont("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const center = {
  display: "grid",
  placeItems: "center",
  width: "100%",
  textAlign: "center" as const,
};

const maskedSlideLines = [
  sample,
  "Drop scenes into",
  "TransitionSeries",
];

const maskedSlideGhostStyle = {
  display: "grid",
  placeItems: "center",
  width: "100%",
  textAlign: "center" as const,
};

/**
 * Preview timing convention for this file.
 *
 * The audit samples every preview at 15% / 50% / 90% of its window — on the
 * default 120-frame window that is frames 18, 60 and 108. A text effect left on
 * its own short default starts at frame 0 and is finished well before frame 18,
 * so all three samples land on resolved type and the tile reads as a still
 * image. Each preview therefore delays its entrance and stretches it so the
 * effect is mid-flight at the enter sample and settled by the hold sample.
 */
const ENTER_SAMPLE_FRAME = 18;

/**
 * Enter-only, and `EASING_ENTER` is an expo-out: the blur is 90% resolved a
 * third of the way through its duration, so the visible motion is ~28 frames
 * however long the duration is set. On the 120-frame default that left the back
 * two thirds of the loop settled. The window is 48 frames (in `preview-config`)
 * and the entrance starts on frame 4, which puts the motion across roughly
 * 8-70% of the loop and the rest at the end, where remocn's pattern 5 puts it.
 * This one deliberately does not use `ENTER_SAMPLE_FRAME` — that constant is
 * calibrated against the 120-frame default window.
 */
export const BlurFocusInPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}>
      <BlurFocusIn text={sample} delayInFrames={4} durationInFrames={54} />
    </div>
  </PreviewFrame>
);

export const StaggeredFadeUpPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}><StaggeredFadeUp text={`${sample} ${sub}`} /></div>
  </PreviewFrame>
);

export const MaskedSlideRevealPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <PreviewGhostStack
      ghost={
        <div style={maskedSlideGhostStyle}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.18em",
              fontSize: 64,
              fontWeight: 600,
              color: "#f4f4f5",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
            }}
          >
            {maskedSlideLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </div>
      }
    >
      <div style={maskedSlideGhostStyle}>
        {/* The 6/16 default landed all three lines by frame 28, so every sample
            caught a settled headline. Stretched so one line is still climbing
            out of its mask at each sample. */}
        <MaskedSlideReveal
          lines={maskedSlideLines}
          delayInFrames={10}
          staggerInFrames={18}
          durationInFrames={26}
        />
      </div>
    </PreviewGhostStack>
  </PreviewFrame>
);

/**
 * The one preview in this file that does not run on the 120-frame window, so it
 * does not use `ENTER_SAMPLE_FRAME`. `springSmooth` is already at 0.90 halfway
 * through its own duration, so no delay inside a 120-frame window puts the 50%
 * and 90% samples on different states — both caught settled type (a pixel-
 * identical pair). `preview-config` gives this slug a 72-frame window instead,
 * which samples frames 10 / 36 / 64; the entrance is stretched to 92 frames and
 * started 10 frames before the window so those land at spring progress
 * 0.50 / 0.90 / 0.99 — half-tracked and blurred, closing, settled.
 *
 * Short copy, not the 25-character `sample` the rest of the file uses. The span
 * no longer wraps, and the widest state of a tracking entrance is its first
 * frame: at any size that reads on a 308px tile, a 25-character line at full
 * tracking is wider than the 816px content box. Fourteen characters at 68px
 * leave room for the whole 0.28em to be on screen.
 */
export const TrackingInPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}>
      <TrackingIn
        text={DEMO_COPY.productLaunch.title}
        fontSize={68}
        delayInFrames={-10}
        durationInFrames={92}
      />
    </div>
  </PreviewFrame>
);

/**
 * A sweep is a travelling highlight, not an entrance, so the shine has to be on
 * the glyphs at all three samples. Two things were parking it off-glyph:
 *
 * - `EASING.editorial` is an ease-in-out, which crushes the ends of the travel
 *   into the first and last few frames. At 15% of the window the band had barely
 *   moved and at 90% it had already left. A specular sweep travels at constant
 *   speed anyway, so this one runs linear.
 * - The gradient is 2.2× the line and travels from 120% to -20%, which puts the
 *   *peak* of the shine on the glyphs only across the middle 60% of the sweep —
 *   the outer fifth at each end is the band clearing the text. Widening the band
 *   does not change that, so the window is not the fix: the preview runs the
 *   sweep across frames -20→155 so that the audit's frames 18, 60 and 108 land
 *   at 22%, 46% and 73% of the travel, all of them inside the on-glyph span.
 * - `bandWidth={14}` then widens the streak to about three fifths of the line,
 *   which is what makes the highlight read at a 308px tile.
 *
 * Result: the shine lights the left third at frame 18, the middle at 60 and the
 * right third at 108. The base is lifted off the `#71717a` default as well —
 * unlit grey type at that value on the `#050505` stage is barely there at a
 * 308px tile.
 */
export const LightSweepTextPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}>
      <LightSweepText
        text={sample}
        delayInFrames={-20}
        durationInFrames={175}
        bandWidth={14}
        easing={Easing.linear}
        baseColor="#83838d"
      />
    </div>
  </PreviewFrame>
);

/**
 * The 40-frame default with no delay finished the roll at frame 40 of 120 and
 * left 80 frames of a pixel-identical plate. The roll now spans frames 10-90
 * with a 5-frame column stagger, so the reel settles left to right: frame 18
 * catches the left columns spinning while the right ones still show the old
 * number, frame 60 catches the tail of the roll, and frame 108 holds the landed
 * value — which is the pose the component is *for*.
 */
export const SlotRollPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}>
      <SlotRoll
        from="12840"
        to="50291"
        delayInFrames={10}
        durationInFrames={80}
        staggerInFrames={5}
      />
    </div>
  </PreviewFrame>
);

/**
 * The default 50-frame decode finishes at frame 50 of a 120-frame window, so
 * the hold and exit samples were both fully resolved type (a 99 dB pair) and
 * the sweep itself was never sampled. Stretching the resolve to frames 6→106
 * puts the front roughly halfway through the string at frame 60 and lands the
 * last character just before the exit sample at 108.
 */
export const MatrixDecodePreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}>
      {/* 48px, not the width-scaled 36: 25 monospace characters at 48px is
          722px of the 816px content box, which is as wide as the line can go
          before `whiteSpace: "pre"` pushes it off the frame. */}
      <MatrixDecode
        text={sample.toUpperCase()}
        delayInFrames={6}
        durationInFrames={100}
        fontSize={48}
      />
    </div>
  </PreviewFrame>
);

export const RgbGlitchTextPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}>
      {/* Three bursts spread across the window: the first is still tearing at
          the enter sample, the second peaks past the middle, and the signal has
          settled by the exit sample. A 34-frame glitch fell entirely between
          samples and never appeared. */}
      <RgbGlitchText
        text="SIGNAL LOCK"
        glitchStartFrame={ENTER_SAMPLE_FRAME - 8}
        glitchDurationInFrames={96}
        maxWidth="100%"
      />
    </div>
  </PreviewFrame>
);

/**
 * One marquee on an empty stage reads as an unstyled div, and a single row can
 * only ever show one `direction` and one `fade`. Three rows at different sizes
 * and speeds fill the frame, run both ways, and put the hard-edged row directly
 * under a faded one — which is the only way the fade is legible in a still.
 *
 * The rows run edge to edge with no frame padding on purpose: a padded marquee
 * fades out short of the frame, so the effect it is meant to demonstrate lands
 * in the middle of the stage instead of at the boundary.
 */
const marqueeRows = [
  {
    label: 'direction "left" · fade 0.08',
    text: sample,
    direction: "left" as const,
    speed: 2.6,
    fontSize: 60,
    color: "#f4f4f5",
  },
  {
    label: 'direction "right" · fade 0.08',
    text: DEMO_COPY.productLaunch.subtitle,
    direction: "right" as const,
    speed: 1.7,
    fontSize: 44,
    color: "rgba(244,244,245,0.62)",
  },
  {
    label: "fade 0 · hard edge",
    text: sub,
    direction: "left" as const,
    speed: 3.4,
    fontSize: 44,
    fade: 0,
    color: "#f4f4f5",
  },
];

export const InfiniteMarqueePreview = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 56,
      }}
    >
      {marqueeRows.map((row) => (
        <div key={row.label} style={{ display: "grid", gap: 10 }}>
          <div style={{ paddingInline: 48 }}>
            <PreviewKicker lane="atoms">{row.label}</PreviewKicker>
          </div>
          <InfiniteMarquee
            text={row.text}
            direction={row.direction}
            speed={row.speed}
            fontSize={row.fontSize}
            color={row.color}
            fade={row.fade}
          />
        </div>
      ))}
    </div>
  </PreviewFrame>
);

/**
 * A floor marquee lives in the lower third — that is the geometry, not a bug —
 * so the preview is a *scene* that uses it: the camera comes up (`floorTilt`
 * 62 instead of 70) and a title block occupies the air above the horizon that
 * was previously an empty black plate.
 *
 * `lineWidth={2}` is load-bearing. The horizon and the floor grid are 1px by
 * default, which is half a device pixel at the audit's 0.5 scale and a third of
 * one in a 308px tile — Chromium drops them outright, and the finding that "the
 * horizon line is empty black" was exactly that.
 */
export const PerspectiveMarqueePreview = () => {
  const { delayRender, continueRender } = useDelayRender();
  // Rule 27. `PerspectiveMarquee` calls `measureText()` inside a `useMemo` and
  // divides the resulting track length by `speed` to get its loop period. That
  // memo runs once: if it runs while the family is still the fallback, the
  // period is wrong for the whole clip and the scroll speed silently stops
  // matching the stated `speed`. Hold the frame until the face is actually
  // swapped in, and only mount the marquee after — so the memo's first (and
  // only) run measures Inter, not system-ui.
  const [handle] = useState(() => delayRender("Loading marquee font"));
  const [fontReady, setFontReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    marqueeFont.waitUntilDone().then(() => {
      if (cancelled) return;
      setFontReady(true);
      continueRender(handle);
    });
    return () => {
      cancelled = true;
    };
  }, [continueRender, handle]);

  return (
  <PreviewFrame lane="atoms" padding={0} justifyContent="stretch" alignItems="stretch">
    <AbsoluteFill>
      {fontReady ? (
        <PerspectiveMarquee
          text={sample}
          fontSize={44}
          fontFamily={marqueeFont.fontFamily}
          floorTilt={62}
          lineWidth={2}
          nearGlow
        />
      ) : null}
    </AbsoluteFill>
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-start",
        // The horizon sits at 26% of the frame (140px of 540). The title block
        // ends above it — a full-width rule through the middle of a headline
        // reads as a clipping bug.
        paddingTop: 22,
        pointerEvents: "none",
      }}
    >
      <div style={{ display: "grid", gap: 8, justifyItems: "center" }}>
        <div
          style={{
            color: "rgba(244,244,245,0.58)",
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {DEMO_COPY.productLaunch.subtitle}
        </div>
        <div
          style={{
            color: "#f4f4f5",
            fontSize: 64,
            lineHeight: 0.98,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          {DEMO_COPY.productLaunch.title}
        </div>
      </div>
    </AbsoluteFill>
  </PreviewFrame>
  );
};

/* StrikethroughReplacePreview lives in ./strikethrough-replace — it needs a
 * composed stage rather than one centred line. */
