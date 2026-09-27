import { interpolate, Sequence, spring } from "remotion";
import { HeroLoop } from "@/compositions/hero-loop";
import { Intro } from "@/compositions/intro";
import { SimulatedCursor, type SimulatedCursorPoint } from "@/remotion/primitives/simulated-cursor";
import { TerminalSimulator } from "@/remotion/scenes/terminal-simulator";
import { DOCS, FAN, FPS, HERO, TERMINAL, THESIS } from "../timeline";
import { DOCS_RECTS, HERO_RECTS, centre, type Rect } from "../captures";
import { PANEL, TERM, WORLD } from "../camera/shots";
import { ADD_COMMAND, CLI_OUTPUT, INTRO_PROPS } from "../facts";
import { COLORS } from "../theme";
import { CLAMP, ease } from "../lib/anim";
import { Capture, InRect, Plane } from "./Plane";
import { PhosphorField } from "./PhosphorField";

/** The homepage's --bay-bg (dark): rgb(6,6,5), sampled from the capture and matching the field shader's uPageDark. */
const HERO_PAGE = "#060605";

/**
 * The field's clock. On the site it is seconds since the page loaded; the film
 * starts it a few seconds in (so the fan is already moving) and runs it at
 * real time, one film second per field second.
 */
const FIELD_T0 = 6;

const CURSOR_SIZE = 30;

/**
 * Cursor waypoint that puts the pointer's tip on the centre of `rect`. The
 * registry cursor's tip sits at (5/24, 3/24) of its box.
 */
const tipOn = (rect: Rect, frame: number, target?: number): SimulatedCursorPoint => {
  const c = centre(rect);
  return {
    x: ((c.x - CURSOR_SIZE * (5 / 24)) / PANEL.w) * 100,
    y: ((c.y - CURSOR_SIZE * (3 / 24)) / PANEL.h) * 100,
    frame,
    target,
  };
};

const offPanel = (x: number, y: number, frame: number): SimulatedCursorPoint => ({ x, y, frame });

/* --------------------------------------------------------------------- hero */

export const HERO_CURSOR: SimulatedCursorPoint[] = [
  offPanel(84, 96, HERO.cursorIn),
  tipOn(HERO_RECTS.browse, HERO.click - 5, 64),
];

/** `flat` draws the plane head-on with no tilt or shadow: the LaunchHeroCheck QA composition. */
export const HeroScreen: React.FC<{ frame: number; flat?: boolean }> = ({ frame, flat = false }) => {
  if (!flat && (frame < THESIS.pushStart - 2 || frame > DOCS.travelEnd + 6)) {
    return null;
  }
  // The plane leans back a little and straightens as the camera settles on it.
  const straighten = interpolate(frame, [HERO.settleStart, HERO.settleEnd], [0, 1], { ...CLAMP, easing: ease.inOut });
  return (
    <Plane
      x={WORLD.hero.x}
      y={WORLD.hero.y}
      radius={flat ? 0 : undefined}
      tiltX={flat ? 0 : 9 - 4 * straighten}
      tiltY={flat ? 0 : -7 + 3 * straighten}
      style={{ background: HERO_PAGE, isolation: "isolate" }}
    >
      <PhosphorField rect={HERO_RECTS.field} time={FIELD_T0 + (frame - HERO.arriveStart) / FPS} />
      {/* The copy layer's page pixels are the field's own page colour, so lighten
          lets the field through them and keeps the type on top. */}
      <Capture id="hero" blend="lighten" />
      {/* Transparent, as on the site: the field runs straight through the monitor. */}
      <InRect rect={HERO_RECTS.player}>
        <Sequence from={HERO.arriveStart - HERO.loopOffset} layout="none">
          <HeroLoop background="transparent" tone="dark" />
        </Sequence>
      </InRect>
      {frame >= HERO.cursorIn && !flat ? (
        <SimulatedCursor points={HERO_CURSOR} clickFrames={[HERO.click]} size={CURSOR_SIZE} accent={COLORS.phosphor} />
      ) : null}
    </Plane>
  );
};

/* --------------------------------------------------------------------- docs */

export const DOCS_CURSOR: SimulatedCursorPoint[] = [
  offPanel(60, 78, DOCS.cursorIn),
  tipOn(DOCS_RECTS.copy, DOCS.copyClick - 4, 58),
];

/** 0 → 1 as the terminal grows out of the command line. */
export const terminalGrowth = (frame: number): number =>
  spring({ frame: frame - TERMINAL.start, fps: FPS, config: { damping: 20, stiffness: 90, mass: 0.9 }, durationInFrames: TERMINAL.growEnd - TERMINAL.start });

export const DocsScreen: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < DOCS.travelStart - 2 || frame > FAN.travelEnd + 4) {
    return null;
  }
  const copied = interpolate(frame, [DOCS.copied, DOCS.copied + 3], [0, 1], CLAMP);
  // Depth of field: the page falls out of focus behind the terminal.
  const focus = interpolate(terminalGrowth(frame), [0.15, 1], [0, 1], CLAMP);
  return (
    <Plane x={WORLD.docs.x} y={WORLD.docs.y} tiltX={6} tiltY={5} focus={focus}>
      <Capture id="docs" />
      <Capture id="docsCopied" opacity={copied} />
      <InRect rect={DOCS_RECTS.player} background="#080810">
        <Sequence from={DOCS.travelStart - 40} layout="none">
          <Intro {...INTRO_PROPS} />
        </Sequence>
      </InRect>
      {frame >= DOCS.cursorIn && frame < DOCS.pushEnd + 10 ? (
        <SimulatedCursor points={DOCS_CURSOR} clickFrames={[DOCS.copyClick]} size={CURSOR_SIZE} accent={COLORS.phosphor} />
      ) : null}
    </Plane>
  );
};

/* ----------------------------------------------------------------- terminal */

export const TERMINAL_STEPS = [
  ...CLI_OUTPUT.files.map((text) => ({ text, tone: "success" as const, work: TERMINAL.stepWork })),
  { text: CLI_OUTPUT.registered, tone: "success" as const, work: TERMINAL.stepWork },
  { text: CLI_OUTPUT.installing, tone: "info" as const },
];

/** The docs code line, where the terminal is born, in world units. */
const codeOrigin = () => {
  const c = centre(DOCS_RECTS.code);
  return { x: WORLD.docs.x + c.x, y: WORLD.docs.y + c.y };
};

export const TerminalScreen: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < TERMINAL.start || frame > FAN.flipStart + 4) {
    return null;
  }
  const grow = terminalGrowth(frame);
  const from = codeOrigin();
  const cx = from.x + (TERM.centre.x - from.x) * grow;
  const cy = from.y + (TERM.centre.y - from.y) * grow;
  const scale = TERM.scale * (0.06 + 0.94 * grow);
  // It recedes out of focus as the camera leaves for the fan.
  const recede = interpolate(frame, [FAN.travelStart + 6, FAN.travelEnd], [0, 1], CLAMP);
  return (
    <div
      style={{
        position: "absolute",
        left: cx - PANEL.w / 2,
        top: cy - PANEL.h / 2,
        width: PANEL.w,
        height: PANEL.h,
        transform: `perspective(2600px) rotateX(${7 - 2 * grow}deg) rotateY(${-9 + 3 * grow}deg) scale(${scale})`,
        opacity: interpolate(grow, [0, 0.12], [0, 1], CLAMP),
        filter: recede > 0.01 ? `blur(${recede * 6}px) brightness(${1 - recede * 0.4})` : undefined,
      }}
    >
      <Sequence from={TERMINAL.start} layout="none">
        <TerminalSimulator
          command={ADD_COMMAND}
          steps={TERMINAL_STEPS}
          summary={CLI_OUTPUT.done}
          prompt="~/my-video"
          title="my-video"
          shell="zsh"
          accentColor={COLORS.phosphor}
          backgroundColor="transparent"
          speed={TERMINAL.speed}
        />
      </Sequence>
    </div>
  );
};
