"use client";

import { Player, type PlayerRef } from "@remotion/player";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { HeroLoopPreview } from "@/components/previews/hero-loop";
import { previewMeta } from "@/lib/preview-config";
import { usePlayerFrameValue } from "@/lib/use-player-frame-value";
import { ProgramScrubBar } from "./program-scrub-bar";

/** Length and framing come from the docs preview config, not a fourth copy. */
const HERO = previewMeta("hero-loop");

/**
 * Frame the monitor opens on.
 *
 * hero-loop's own title beat runs 316-50 and sets a display headline in the
 * middle of the picture, which would land beside the page's headline on
 * arrival. 200 is inside the catalog beat: the count has settled on its real
 * value, all twelve cards are in, and nothing in the picture repeats the copy.
 * The poster is the same frame, so the handoff from image to Player is silent.
 */
const OPEN_FRAME = 200;

/** Progress past which the copy has finished fading and should leave the DOM tree. */
const COPY_CLEARED = 0.25;

type ProgramMonitorProps = {
  /** Hero copy. Server-rendered and passed through, so it needs no hydration. */
  children: ReactNode;
};

/**
 * Scroll-expanding program monitor.
 *
 * At rest the loop is an object on the page: a cornered monitor flush to the
 * right edge with the copy beside it. Scrolling opens it out until it is the
 * whole stage, and the copy hands over on the way. The scrub bar stays pinned
 * under both states, because the transport belongs to the program at any size.
 *
 * Mechanics worth knowing before editing:
 * - Progress is a MotionValue written to a CSS custom property, never to state.
 *   Nothing in this tree re-renders while you scroll or while the loop plays.
 * - The expansion is transform and border-radius only. See globals.css.
 * - Mobile and tablet (< 1024px) collapse: the monitor is a full-width 16:9
 *   block at the top of the stage and the copy sits underneath it on the page
 *   background. No transform, no runway, nothing pinned.
 */
export function ProgramMonitor({ children }: ProgramMonitorProps) {
  const playerRef = useRef<PlayerRef>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const frame = usePlayerFrameValue(playerRef);
  const reduce = useReducedMotion();

  const [live, setLive] = useState(false);
  /** Discrete, not continuous: flips once, when the copy has finished fading. */
  const [copyGone, setCopyGone] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const progress: MotionValue<number> = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [0, 1],
  );

  useMotionValueEvent(progress, "change", (value) => {
    const gone = value > COPY_CLEARED;
    if (gone !== copyGone) setCopyGone(gone);
  });

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    player.setVolume(0);

    // Reduced motion keeps the composition mounted and parked on OPEN_FRAME, so
    // the scrub bar still works: the visitor drives the loop instead of it
    // driving itself.
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const raf = window.requestAnimationFrame(() => {
      if (!reduced) player.play();
      setLive(true);
    });

    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-headline"
      className="relative bg-[var(--bay-bg)]"
    >
      <motion.div
        style={{ "--p": progress } as CSSProperties}
        className="sticky top-14 grid h-[calc(100dvh-3.5rem)] grid-rows-[1fr_auto] overflow-hidden border-b border-[var(--bay-border)]"
      >
        <div className="relative flex min-h-0 flex-col lg:block">
          {/*
            The monitor. `bay-stage-scope` is scoped to it alone, so the dark
            picture is an object inside the page's own theme rather than a
            section that inverts the page.
          */}
          <div className="program-shell bay-stage-scope relative aspect-video w-full shrink-0 overflow-hidden bg-[var(--bay-stage)] lg:shadow-[0_50px_110px_-40px_rgba(0,0,0,0.65)]">
            {/*
              Poster. The stage paints a real frame on first byte instead of a
              black hole waiting for hydration, and it is what reduced-motion
              and no-JS visitors keep looking at.
            */}
            <Image
              src="/media/hero-loop-frame.webp"
              alt=""
              fill
              priority
              /*
                The poster is only on screen before the Player goes live, i.e.
                with the shell at rest. Below `lg` rest is the full-width block;
                at `lg` rest is --rest-scale, half the stage. Claiming 100vw at
                `lg` fetched a source twice the size ever painted.
              */
              sizes="(min-width: 1024px) 50vw, 100vw"
              className={`object-cover transition-opacity duration-500 ${
                live ? "opacity-0" : "opacity-100"
              }`}
            />
            <Player
              ref={playerRef}
              component={HeroLoopPreview}
              durationInFrames={HERO.durationInFrames}
              fps={HERO.fps}
              compositionWidth={HERO.width}
              compositionHeight={HERO.height}
              style={{ width: "100%", height: "100%", display: "block" }}
              initialFrame={OPEN_FRAME}
              controls={false}
              loop
              autoPlay={false}
              clickToPlay={false}
              initiallyMuted
              showPosterWhenUnplayed={false}
              acknowledgeRemotionLicense
            />

            <div
              className="program-ring pointer-events-none absolute inset-0 rounded-[inherit]"
              aria-hidden
            />
          </div>

          <div
            className={`program-copy relative z-10 flex flex-1 items-center ${
              copyGone ? "pointer-events-none" : ""
            } lg:absolute lg:inset-0`}
            aria-hidden={copyGone || undefined}
          >
            <div className="mx-auto w-full max-w-[1280px] px-6 py-8 lg:py-0">
              <div className="lg:max-w-[34rem]">{children}</div>
            </div>
          </div>
        </div>

        <ProgramScrubBar
          playerRef={playerRef}
          frame={frame}
          durationInFrames={HERO.durationInFrames}
          fps={HERO.fps}
        />
      </motion.div>

      {/*
        Scroll runway. Its height is how far you travel to open the monitor, and
        it is the only reason the stage above is sticky. Desktop only, and gone
        under reduced motion.
      */}
      <div className="program-runway" aria-hidden />
    </section>
  );
}
