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
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { HeroLoopPreview } from "@/components/previews/hero-loop";
import { previewMeta } from "@/lib/preview-config";
import { PhosphorField } from "./phosphor-field";

/** Length and framing come from the docs preview config, not a fourth copy. */
const HERO = previewMeta("hero-loop");

/**
 * Frame the monitor opens on.
 *
 * hero-loop is built so frame 0 is its calmest picture: the clean, fully lit
 * mark in a hold, no pass acting, glow at its peak. There is no headline in the
 * loop to collide with the page's own, so there is nothing to skip past. The
 * poster is the same frame, so the handoff from image to Player is silent.
 */
const OPEN_FRAME = 0;

/** Progress past which the copy has finished fading and should leave the DOM tree. */
const COPY_CLEARED = 0.25;

/** Progress stops for the bezel: hidden, starts at 2%, full by 25%, out 75% to 100%. */
const RING_STOPS = [0, 0.02, 0.25, 0.75, 1];

type ProgramMonitorProps = {
  /** Hero copy. Server-rendered and passed through, so it needs no hydration. */
  children: ReactNode;
};

/**
 * Scroll-expanding program monitor.
 *
 * At rest the loop is an object on the page: a cornered monitor flush to the
 * right edge with the copy beside it. Scrolling opens it out until it is the
 * whole stage, and the copy hands over on the way.
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
  const reduce = useReducedMotion();

  const [live, setLive] = useState(false);
  /**
   * The loop is transparent here, so it needs to know the page theme to ink
   * the wordmark. Read from the root's `dark` class, which is what the site's
   * theme toggle flips; it changes only on a theme switch, never per frame.
   */
  const [tone, setTone] = useState<"dark" | "light">("dark");
  const inputProps = useMemo(
    () => ({ background: "transparent" as const, tone }),
    [tone],
  );

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setTone(root.classList.contains("dark") ? "dark" : "light");
    read();
    const watch = new MutationObserver(read);
    watch.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => watch.disconnect();
  }, []);
  /** Discrete, not continuous: flips once, when the copy has finished fading. */
  const [copyGone, setCopyGone] = useState(false);

  /**
   * The open-out is a desktop affordance. Below `lg` there is no runway, so the
   * sticky stage is its own scroll range and `scrollYProgress` would snap 0->1
   * on the first flick: the phosphor field would blow out over the copy and
   * `copyGone` would kill the CLI and link tap targets. Pin progress at 0 there,
   * exactly as reduced motion does.
   */
  const [opens, setOpens] = useState(false);
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const read = () => setOpens(wide.matches);
    read();
    wide.addEventListener("change", read);
    return () => wide.removeEventListener("change", read);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const progress: MotionValue<number> = useTransform(
    scrollYProgress,
    [0, 1],
    reduce || !opens ? [0, 0] : [0, 1],
  );

  /**
   * Bezel opacity. Hidden at rest so the logo floats in the page light with no
   * box cut out of it; fades in once scrolling starts, and back out once the
   * monitor is the whole stage. Reduced motion pins progress at 0, so it stays
   * hidden there.
   */
  const ringOpacity = useTransform(progress, RING_STOPS, [0, 0, 1, 1, 0]);

  useMotionValueEvent(progress, "change", (value) => {
    const gone = value > COPY_CLEARED;
    if (gone !== copyGone) setCopyGone(gone);
  });

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    player.setVolume(0);

    // Reduced motion keeps the composition mounted and parked on OPEN_FRAME.
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
        className="sticky top-14 grid h-[calc(100dvh-3.5rem)] grid-rows-[1fr] overflow-hidden border-b border-[var(--bay-border)]"
      >
        <div className="relative flex min-h-0 flex-col lg:block">
          {/*
            Light field behind the copy. It reads the same scroll progress as
            the monitor, so opening the program also brings the lights down.
          */}
          <div
            aria-hidden
            className="phosphor-mask pointer-events-none absolute inset-0"
          >
            <PhosphorField progress={progress} />
          </div>

          {/*
            The monitor is a window into the page's own light: the screen has
            no fill, and the loop is rendered with a transparent background, so
            the phosphor field behind it runs straight through. Only the
            hairline bezel is drawn, and only once scrolling starts.
            `bay-stage-scope` still scopes the dark tokens to the monitor's
            subtree.
          */}
          <div className="program-shell bay-stage-scope relative aspect-video w-full shrink-0 overflow-hidden">
            {/*
              Posters: frame 0 with an alpha background, one per theme, so first
              paint is the same logo over the same live light the Player shows.
              CSS picks the theme's poster before hydration, so there is no
              flash of the wrong one.
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
              sizes="(min-width: 1024px) 72vw, 100vw"
              className={`hero-poster-dark object-cover transition-opacity duration-500 ${
                live ? "opacity-0" : "opacity-100"
              }`}
            />
            <Image
              src="/media/hero-loop-frame-light.webp"
              alt=""
              fill
              sizes="(min-width: 1024px) 72vw, 100vw"
              className={`hero-poster-light object-cover transition-opacity duration-500 ${
                live ? "opacity-0" : "opacity-100"
              }`}
            />
            <Player
              ref={playerRef}
              component={HeroLoopPreview}
              inputProps={inputProps}
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

            <motion.div
              className="pointer-events-none absolute inset-0 rounded-[inherit]"
              style={{
                opacity: ringOpacity,
                boxShadow: "inset 0 0 0 1px var(--bay-border-strong)",
              }}
              aria-hidden
            />
          </div>

          <div
            className={`program-copy relative z-10 order-first flex flex-1 items-center ${
              copyGone ? "pointer-events-none" : ""
            } lg:absolute lg:inset-x-0 lg:top-0 lg:items-start`}
            aria-hidden={copyGone || undefined}
          >
            <div className="mx-auto w-full max-w-[1280px] px-6 py-8 lg:pt-[clamp(2.5rem,9dvh,6rem)] lg:pb-0">
              <div className="mx-auto max-w-[40rem] text-center">
                {children}
              </div>
            </div>
          </div>
        </div>
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
