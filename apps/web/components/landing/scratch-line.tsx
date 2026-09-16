"use client";

import { useEffect, useRef } from "react";

/**
 * Hand-printed centerline strokes for "for Remotion.", in writing order.
 *
 * These are skeletons, not glyph outlines. A font's letter is a filled shape,
 * so stroking one draws its silhouette rather than a pen mark — which is why a
 * script font can never be drawn on convincingly. Printed rather than cursive
 * because the mark being imitated is a china marker on monitor glass, and an
 * editor marking a take writes in block letters.
 *
 * Baseline 104, x-height 70, ascender 42, descender 130. Verticals sit a degree
 * or two off true on purpose; the boil supplies the rest of the irregularity.
 */
const STROKES = [
  // "for"
  "M 44 104 C 44 82 42 58 49 47 C 53 40 62 39 67 45",
  "M 88 70 C 76 70 69 79 69 88 C 69 98 77 105 88 104 C 98 103 104 96 103 86 C 102 77 96 70 88 70",
  "M 118 104 L 120 70",
  "M 120 81 C 125 72 133 68 141 71",
  // "Remotion."
  "M 196 104 L 194 42",
  "M 194 42 C 213 41 227 45 227 57 C 227 69 212 74 195 73",
  "M 200 73 L 225 104",
  "M 240 89 L 269 85",
  "M 269 85 C 271 77 263 70 254 72 C 244 74 238 83 239 92 C 240 101 249 106 259 104 C 264 103 267 100 269 97",
  "M 286 104 L 288 70",
  "M 288 79 C 292 71 300 68 304 74 C 306 78 306 92 306 104",
  "M 306 79 C 310 71 318 68 322 74 C 324 78 324 92 324 104",
  "M 348 70 C 336 70 329 79 329 88 C 329 98 337 105 348 104 C 358 103 364 96 363 86 C 362 77 356 70 348 70",
  "M 386 50 C 384 68 383 84 383 96 C 383 102 388 105 395 103",
  "M 409 72 L 407 104",
  "M 432 70 C 420 70 413 79 413 88 C 413 98 421 105 432 104 C 442 103 448 96 447 86 C 446 77 440 70 432 70",
  "M 464 104 L 466 70",
  "M 466 79 C 470 71 478 68 483 74 C 485 78 485 92 485 104",
  "M 500 101 L 501 104",
  // Written last, the way a hand does it: cross the f, cross the t, dot the i.
  "M 30 71 L 59 69",
  "M 372 71 L 397 69",
  "M 409 58 L 410 61",
];

/**
 * The boil.
 *
 * Line boil is the wobble hand-drawn animation has because no one can retrace a
 * line exactly. Early animators treated it as a defect; it became the signature
 * of hand-made work precisely because a machine will not produce it by accident.
 *
 * It is driven by cycling the turbulence baseFrequency through a fixed offset
 * sequence — no randomness, so a given tick always yields the same line. McLaren
 * worked in bursts, marking four or five frames and leaving a dozen or more
 * alone, so the line settles, twitches, settles rather than shimmering steadily.
 */
const BASE_FREQUENCY = 0.022;
const OFFSETS = [-0.02, 0.01, -0.01, 0.02];
/** Scale above ~3 turns the type to mush; 2 reads as a drawn line. */
const DISPLACEMENT = 2;
const INTENSITY = 0.32;
const CLUSTER_ON = 5;
const CLUSTER_OFF = 14;
const TICK_MS = 100;

const DRAW_MS = 420;
const DRAW_DELAY_MS = 240;
const DRAW_STAGGER_MS = 46;

export function ScratchLine() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // The grooves render before the strokes, so index modulo the stroke count
    // puts each groove on its own stroke's beat rather than after all of them.
    const paths = Array.from(svg.querySelectorAll("path"));
    for (const [index, path] of paths.entries()) {
      const length = path.getTotalLength();
      const beat = index % STROKES.length;
      path.style.strokeDasharray = `${length} ${length}`;
      path.style.strokeDashoffset = `${length}`;
      // Force layout so the hidden state is committed before the transition.
      void path.getBoundingClientRect();
      path.style.transition = `stroke-dashoffset ${DRAW_MS}ms cubic-bezier(0.32, 0.72, 0.4, 1) ${
        DRAW_DELAY_MS + beat * DRAW_STAGGER_MS
      }ms`;
      path.style.strokeDashoffset = "0";
    }

    const turbulence = svg.querySelector("feTurbulence");
    if (!turbulence) return;

    // The hero copy scrolls away and goes aria-hidden as the monitor opens, and
    // a displacement filter that keeps repainting off-screen costs frames for
    // nothing. The boil runs only while the line is on screen and the tab is in
    // front; the mark it leaves behind is whatever the last tick set.
    let onScreen = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    observer.observe(svg);

    let tick = 0;
    let offsetIndex = 0;
    const timer = window.setInterval(() => {
      if (!onScreen || document.hidden) return;
      tick += 1;
      // Outside a cluster the line is left alone.
      if (tick % (CLUSTER_ON + CLUSTER_OFF) >= CLUSTER_ON) return;
      offsetIndex = (offsetIndex + 1) % OFFSETS.length;
      const frequency = BASE_FREQUENCY + OFFSETS[offsetIndex] * INTENSITY;
      turbulence.setAttribute("baseFrequency", frequency.toFixed(4));
    }, TICK_MS);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      /* No colour of its own: it inherits the headline's, so the line can never
         end up dark on the stage's permanent #050505 the way a page-level muted
         token would in the light theme. */
      className="scratch-line"
      viewBox="0 0 560 150"
      aria-hidden
      focusable="false"
    >
      <filter
        id="hero-scratch-boil"
        x="-6%"
        y="-22%"
        width="112%"
        height="144%"
      >
        <feTurbulence
          type="turbulence"
          baseFrequency={BASE_FREQUENCY}
          numOctaves="2"
          seed="3"
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale={DISPLACEMENT}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>

      <g filter="url(#hero-scratch-boil)">
        <g transform="translate(1.2, 1.2)">
          {STROKES.map((d) => (
            <path key={`groove-${d}`} className="scratch-groove" d={d} />
          ))}
        </g>
        <g>
          {STROKES.map((d) => (
            <path key={`stroke-${d}`} className="scratch-stroke" d={d} />
          ))}
        </g>
      </g>
    </svg>
  );
}
