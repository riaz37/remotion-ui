import { loadFont as loadBodyFont } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadMonoFont } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadDisplayFont } from "@remotion/google-fonts/Newsreader";
import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Counter } from "@/remotion/primitives/counter";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { SlideUp } from "@/remotion/primitives/slide-up";
import { SpringIn } from "@/remotion/primitives/spring-in";
import { StaggerChildren } from "@/remotion/primitives/stagger-children";
import { Typewriter } from "@/remotion/primitives/typewriter";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";
import { enterProgress } from "@/remotion/lib/timing";

/**
 * hero-loop — the landing-page monitor composition.
 *
 * Four beats over 360 frames (12s @ 30fps):
 *   title 0-50 · install 36-150 · catalog 136-258 · render 244-330 · title 316-360
 *
 * Every beat travels the same direction — it arrives from below and leaves
 * upward — so the overlapping handoffs read as one continuous roll instead of a
 * double exposure of two centred layouts.
 *
 * The title beat is a single element driven by the global frame, so its state
 * at the last frame is its state at frame 0 and the wrap is invisible. The only
 * moving thing that crosses the seam is the tally light, whose 30-frame period
 * divides 360 exactly. Everything else lives in a `<Sequence>` so off-screen
 * beats are unmounted.
 */

const { fontFamily: displayFamily } = loadDisplayFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

const { fontFamily: bodyFamily } = loadBodyFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

const { fontFamily: monoFamily } = loadMonoFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

/** Edit Bay palette. No blue anywhere — phosphor amber is the only accent. */
const COLORS = {
  stage: "#050505",
  panel: "#0d0c0b",
  panelRaised: "#141210",
  hairline: "rgba(236, 236, 236, 0.09)",
  hairlineStrong: "rgba(236, 236, 236, 0.16)",
  ink: "#ececec",
  muted: "#8b857c",
  dim: "#575149",
  phosphor: "#e8b86d",
} as const;

/** Lane stripe hues from the registry atlas — stripe only, never a surface. */
const LANE = {
  atoms: "oklch(0.55 0.06 252)",
  signals: "oklch(0.55 0.06 285)",
  vectors: "oklch(0.55 0.06 195)",
  spatial: "oklch(0.55 0.06 155)",
  blocks: "oklch(0.55 0.06 48)",
  cuts: "oklch(0.55 0.06 25)",
  reels: "oklch(0.55 0.06 330)",
} as const;

/**
 * Handoff shape, shared by every beat.
 *
 * Opacity and travel run on different clocks on purpose. The fade is short and
 * front-loaded so an outgoing beat is a faint ghost within three frames, while
 * the longer travel keeps both layouts physically apart for the whole handoff.
 * Fading and moving on one curve is what turns an overlap into a double
 * exposure of two centred layouts.
 */
const BEAT_ENTER_FADE = 14;
const BEAT_ENTER_MOVE = 24;
const BEAT_EXIT_FADE = 12;
const BEAT_EXIT_MOVE = 18;
/** The title carries more travel than a panel — it is the only full-bleed beat. */
const TITLE_ENTER_MOVE = 26;
/** Frames between one beat starting to leave and the next arriving. */
const BEAT_OVERLAP = 4;

/** A beat's Sequence has to outlive its fade so the travel can finish. */
const beat = (from: number, exitAt: number) =>
  ({ from, exitAt, durationInFrames: exitAt + BEAT_EXIT_MOVE }) as const;

/** Each beat is chained off the previous one so the schedule cannot drift. */
const TITLE_EXIT = 32;
const INSTALL = beat(TITLE_EXIT + BEAT_OVERLAP, 96);
const CATALOG = beat(INSTALL.from + INSTALL.exitAt + BEAT_OVERLAP, 104);
const RENDER = beat(CATALOG.from + CATALOG.exitAt + BEAT_OVERLAP, 68);
const TITLE_ENTER = RENDER.from + RENDER.exitAt + BEAT_OVERLAP;
/** Frame where the title switches from "leaving" to "returning". */
const TITLE_PIVOT = 180;

const PREMOUNT = 10;

const TITLE_LINES = ["Compositions you own,", "frame by frame."] as const;

const TITLE_SUB = "Install with the CLI. Every frame lands in your repo.";

const INSTALL_COMMAND = "npx remotion-ui@latest add social-clip";

const INSTALL_FILES = [
  "src/compositions/social-clip/index.tsx",
  "src/remotion/scenes/caption-scene.tsx",
  "src/remotion/primitives/typewriter.tsx",
  "src/remotion/lib/timing.ts",
] as const;

/**
 * The two facts the hero states about the registry. Both are written by
 * `pnpm registry:build` from registry.json + the atlas, so a rename or a new
 * component can never leave a stale number or a dead name on the landing page.
 * Edit the curated card order in scripts/build-registry.mts, not here.
 */
// #region generated:registry-facts
const REGISTRY_COUNT = 167;

const CATALOG_ITEMS = [
  { name: "social-clip", kind: "composition", stripe: LANE.reels },
  { name: "caption-scene", kind: "scene", stripe: LANE.signals },
  { name: "typewriter", kind: "primitive", stripe: LANE.atoms },
  { name: "audiogram-bars", kind: "primitive", stripe: LANE.signals },
  { name: "lower-third", kind: "scene", stripe: LANE.blocks },
  { name: "path-draw", kind: "primitive", stripe: LANE.vectors },
  { name: "metric-ticker", kind: "scene", stripe: LANE.signals },
  { name: "transition-wipe", kind: "primitive", stripe: LANE.cuts },
  { name: "data-story", kind: "composition", stripe: LANE.reels },
  { name: "karaoke-captions", kind: "primitive", stripe: LANE.signals },
  { name: "code-reveal", kind: "scene", stripe: LANE.blocks },
  { name: "logo-reveal", kind: "scene", stripe: LANE.vectors },
] as const;
// #endregion generated:registry-facts

type Metrics = {
  /** Scale a 1080p-reference size against the frame's shorter edge. */
  s: (size: number) => number;
  safe: ReturnType<typeof getSafeAreaPadding>;
  contentWidth: number;
  panelWidth: number;
  gridWidth: number;
  gridColumns: number;
  gridGap: number;
  cardHeight: number;
  titleWidth: number;
  /** Auto-fit so the longest headline never wraps in a narrow crop. */
  headlineSize: number;
  mono: number;
  tick: number;
};

/** Longest title line, in ems, at Newsreader 500 — used to auto-fit the display size. */
const TITLE_LINE_EMS = 10.6;

function useMetrics(): Metrics {
  const { width, height } = useVideoConfig();

  return useMemo(() => {
    const basis = Math.min(width, height);
    const s = (size: number) => scaleFont(size, basis);
    const safe = getSafeAreaPadding({ width, height });
    const inner = s(36);
    const contentWidth = Math.max(
      s(320),
      width - safe.paddingLeft - safe.paddingRight - inner * 2,
    );
    const gridWidth = Math.min(contentWidth, s(1500));
    const titleWidth = Math.min(contentWidth, s(1300));

    return {
      s,
      safe,
      contentWidth,
      panelWidth: Math.min(contentWidth, s(1300)),
      gridWidth,
      gridColumns: gridWidth >= s(1000) ? 4 : 2,
      gridGap: s(14),
      cardHeight: s(94),
      titleWidth,
      headlineSize: Math.min(s(92), Math.floor(titleWidth / TITLE_LINE_EMS)),
      mono: s(26),
      tick: s(30),
    };
  }, [width, height]);
}

export const HeroLoop: React.FC = () => {
  const metrics = useMetrics();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.stage,
        color: COLORS.ink,
        fontFamily: bodyFamily,
      }}
    >
      <StageChrome m={metrics} />
      <TitleBeat m={metrics} />

      <Sequence
        from={INSTALL.from}
        durationInFrames={INSTALL.durationInFrames}
        premountFor={PREMOUNT}
        name="install"
      >
        <InstallBeat m={metrics} />
      </Sequence>

      <Sequence
        from={CATALOG.from}
        durationInFrames={CATALOG.durationInFrames}
        premountFor={PREMOUNT}
        name="catalog"
      >
        <CatalogBeat m={metrics} />
      </Sequence>

      <Sequence
        from={RENDER.from}
        durationInFrames={RENDER.durationInFrames}
        premountFor={PREMOUNT}
        name="render"
      >
        <RenderBeat m={metrics} />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * Safe-area corner ticks plus a two-label slate. Static apart from the tally
 * light, which is the one thing alive during the title hold.
 *
 * The tally blinks on a 30-frame period and 360 divides by 30, so the phase at
 * the wrap is the phase at frame 0 — the loop stays seamless even though the
 * frames either side of the seam are no longer pixel-identical.
 */
const TALLY_BLINK = 30;

const StageChrome: React.FC<{ m: Metrics }> = ({ m }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { safe, tick, s } = m;
  const labelSize = s(17);
  const tally = interpolate(
    (frame % TALLY_BLINK) / TALLY_BLINK,
    [0, 0.42, 0.5, 0.92, 1],
    [1, 1, 0.22, 0.22, 1],
    { easing: EASING.editorial },
  );

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: safe.paddingLeft,
          right: safe.paddingRight,
          top: safe.paddingTop,
          bottom: safe.paddingBottom,
        }}
      >
        <CornerTick size={tick} corner="tl" />
        <CornerTick size={tick} corner="tr" />
        <CornerTick size={tick} corner="bl" />
        <CornerTick size={tick} corner="br" />
      </div>

      <div
        style={{
          position: "absolute",
          left: safe.paddingLeft + tick + s(16),
          top: safe.paddingTop - labelSize,
          display: "flex",
          alignItems: "center",
          gap: s(9),
          fontFamily: monoFamily,
          fontSize: labelSize,
          letterSpacing: "0.01em",
          color: COLORS.muted,
        }}
      >
        <span
          style={{
            width: s(6),
            height: s(6),
            backgroundColor: COLORS.phosphor,
            opacity: tally,
          }}
        />
        remotion-ui
      </div>

      <div
        style={{
          position: "absolute",
          right: safe.paddingRight + tick + s(16),
          bottom: safe.paddingBottom - labelSize,
          fontFamily: monoFamily,
          fontSize: labelSize,
          letterSpacing: "0.01em",
          color: COLORS.dim,
        }}
      >
        {width} × {height} · {fps} fps
      </div>
    </AbsoluteFill>
  );
};

const CornerTick: React.FC<{
  size: number;
  corner: "tl" | "tr" | "bl" | "br";
}> = ({ size, corner }) => {
  const isTop = corner === "tl" || corner === "tr";
  const isLeft = corner === "tl" || corner === "bl";
  const edge = `1px solid ${COLORS.hairlineStrong}`;

  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        [isTop ? "top" : "bottom"]: 0,
        [isLeft ? "left" : "right"]: 0,
        [isTop ? "borderTop" : "borderBottom"]: edge,
        [isLeft ? "borderLeft" : "borderRight"]: edge,
      }}
    />
  );
};

/**
 * The loop anchor. Rendered on every frame from the global clock so the state
 * at frame 359 is the state at frame 0 — the wrap has nothing to hide.
 */
const TitleBeat: React.FC<{ m: Metrics }> = ({ m }) => {
  const frame = useCurrentFrame();
  const { s, titleWidth, headlineSize } = m;
  const returning = frame >= TITLE_PIVOT;
  const rise = s(130);

  /**
   * One direction of travel across the whole loop: lines leave upward and
   * return from below, so the cycle reads as a continuous roll. Both branches
   * resolve to opacity 1 / offset 0 outside their window, which is what makes
   * frame 359 and frame 0 the same picture.
   */
  const lineStyle = (index: number): CSSProperties => {
    if (returning) {
      const at = TITLE_ENTER + index * 4;
      const fade = enterProgress(frame, at, BEAT_ENTER_FADE);
      const move = enterProgress(frame, at, TITLE_ENTER_MOVE);
      return { opacity: fade, translate: `0px ${(1 - move) * rise}px` };
    }

    const at = TITLE_EXIT + index * 3;
    const fade = enterProgress(frame, at, BEAT_EXIT_FADE);
    const move = enterProgress(frame, at, BEAT_EXIT_MOVE, EASING.editorial);
    return { opacity: 1 - fade, translate: `0px ${move * -rise}px` };
  };

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: titleWidth, textAlign: "center" }}>
        {TITLE_LINES.map((line, index) => (
          <h1
            key={line}
            style={{
              margin: 0,
              fontFamily: displayFamily,
              fontWeight: 500,
              fontSize: headlineSize,
              lineHeight: 1.12,
              letterSpacing: "-0.01em",
              color: index === 0 ? COLORS.ink : COLORS.phosphor,
              ...lineStyle(index),
            }}
          >
            {line}
          </h1>
        ))}
        <p
          style={{
            margin: `${s(28)}px 0 0`,
            fontSize: s(28),
            lineHeight: 1.5,
            color: COLORS.muted,
            ...lineStyle(2),
          }}
        >
          {TITLE_SUB}
        </p>
      </div>
    </AbsoluteFill>
  );
};

/** Frames, local to the beat, over which the panel opens for its output. */
const INSTALL_OPEN = [34, 48] as const;

const InstallBeat: React.FC<{ m: Metrics }> = ({ m }) => {
  const frame = useCurrentFrame();
  const { s, panelWidth, mono } = m;
  const rowHeight = Math.round(mono * 1.7);
  const rowGap = s(8);
  const filesHeight = rowHeight * INSTALL_FILES.length + rowGap * 3;
  /**
   * The output block owns its full height as one eased opening, timed to the
   * last keystroke. Letting the rows size the panel themselves would re-centre
   * the whole card four times; reserving the height from frame zero — the
   * earlier fix — left a terminal that was a mostly-empty box for a second and
   * a half while the command typed. One growth, once, at the moment output
   * would actually arrive.
   */
  const open = interpolate(frame, INSTALL_OPEN, [0, 1], {
    easing: EASING.editorial,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Beat m={m} exitAt={INSTALL.exitAt}>
      <div style={{ ...panelStyle, width: panelWidth, borderRadius: s(8) }}>
        <PanelHeader m={m} label="terminal" trailing="add" />

        <div
          style={{
            display: "grid",
            gap: s(26),
            padding: `${s(30)}px ${s(34)}px ${s(32)}px`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: s(14),
              height: rowHeight,
            }}
          >
            <span
              style={{
                fontFamily: monoFamily,
                fontSize: mono,
                color: COLORS.dim,
              }}
            >
              $
            </span>
            <Typewriter
              text={INSTALL_COMMAND}
              charFrames={1}
              delayInFrames={6}
              showCursor
              cursorStyle="block"
              cursorColor={COLORS.phosphor}
              cursorBlinkFrames={TALLY_BLINK}
              style={{
                fontFamily: monoFamily,
                fontSize: mono,
                fontWeight: 400,
                color: COLORS.ink,
                lineHeight: `${rowHeight}px`,
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: rowGap,
              height: filesHeight * open,
              overflow: "hidden",
            }}
          >
            <StaggerChildren staggerInFrames={6} baseDelayInFrames={42}>
              {INSTALL_FILES.map((file) => (
                <SlideUp key={file} durationInFrames={18} distance={s(12)}>
                  <div
                    style={{
                      display: "flex",
                      gap: s(16),
                      fontFamily: monoFamily,
                      fontSize: mono,
                      lineHeight: `${rowHeight}px`,
                    }}
                  >
                    <span style={{ color: COLORS.phosphor }}>+</span>
                    <span style={{ color: COLORS.muted }}>{file}</span>
                  </div>
                </SlideUp>
              ))}
            </StaggerChildren>
          </div>

          <FadeIn delayInFrames={70} durationInFrames={14}>
            <p
              style={{
                margin: 0,
                fontFamily: monoFamily,
                fontSize: s(21),
                color: COLORS.dim,
              }}
            >
              4 files written · 0 runtime dependencies
            </p>
          </FadeIn>
        </div>
      </div>
    </Beat>
  );
};

const CatalogBeat: React.FC<{ m: Metrics }> = ({ m }) => {
  const { s, gridWidth, gridColumns, gridGap, cardHeight } = m;
  const headingSize = s(56);
  /** Cards arrive inside Sequences, so the track has to be laid out for the
   *  full set from frame one — otherwise the block re-centres each new row. */
  const rows = Math.ceil(CATALOG_ITEMS.length / gridColumns);

  return (
    <Beat m={m} exitAt={CATALOG.exitAt}>
      <div style={{ width: gridWidth }}>
        <SlideUp durationInFrames={22} distance={s(20)}>
          {/* MotionWrapper shrink-wraps, so the heading carries the track
                width itself to stay centred over the grid. */}
          <h2
            style={{
              width: gridWidth,
              margin: `0 0 ${s(36)}px`,
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: s(16),
              fontFamily: displayFamily,
              fontWeight: 500,
              fontSize: headingSize,
              lineHeight: 1.1,
              color: COLORS.ink,
            }}
          >
            <Counter
              from={REGISTRY_COUNT - 18}
              to={REGISTRY_COUNT}
              durationInFrames={34}
              delayInFrames={2}
              fontSize={headingSize}
              color={COLORS.phosphor}
              fontFamily={displayFamily}
              style={{ fontWeight: 500 }}
            />
            components, one registry.
          </h2>
        </SlideUp>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, ${cardHeight}px)`,
            gap: gridGap,
            height: rows * cardHeight + (rows - 1) * gridGap,
          }}
        >
          <StaggerChildren staggerInFrames={3} baseDelayInFrames={18}>
            {CATALOG_ITEMS.map((item) => (
              <SpringIn key={item.name} durationInFrames={22}>
                <ClipCard m={m} {...item} />
              </SpringIn>
            ))}
          </StaggerChildren>
        </div>
      </div>
    </Beat>
  );
};

const ClipCard: React.FC<{
  m: Metrics;
  name: string;
  kind: string;
  stripe: string;
}> = ({ m, name, kind, stripe }) => {
  const { s } = m;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        height: m.cardHeight,
        boxSizing: "border-box",
        borderRadius: s(6),
        border: `1px solid ${COLORS.hairline}`,
        backgroundColor: COLORS.panel,
        overflow: "hidden",
      }}
    >
      <span
        style={{
          width: s(4),
          alignSelf: "stretch",
          flex: "0 0 auto",
          backgroundColor: stripe,
        }}
      />
      <div
        style={{
          display: "grid",
          gap: s(7),
          padding: `${s(18)}px ${s(20)}px`,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: s(22),
            fontWeight: 500,
            color: COLORS.ink,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: monoFamily,
            fontSize: s(16),
            color: COLORS.muted,
          }}
        >
          {kind}
        </span>
      </div>
    </div>
  );
};

const RenderBeat: React.FC<{ m: Metrics }> = ({ m }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { s, panelWidth, mono } = m;

  const progress = interpolate(frame, [4, 34], [0, 1], {
    easing: EASING.editorial,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const percent = Math.round(progress * 100);
  const rowStyle: CSSProperties = {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: s(24),
    fontFamily: monoFamily,
    fontSize: mono,
    lineHeight: 1.6,
  };

  return (
    <Beat m={m} exitAt={RENDER.exitAt}>
      <div style={{ ...panelStyle, width: panelWidth, borderRadius: s(8) }}>
        <PanelHeader
          m={m}
          label="render queue"
          trailing={`h264 · ${fps} fps`}
        />

        <div
          style={{
            display: "grid",
            gap: s(22),
            padding: `${s(30)}px ${s(34)}px ${s(32)}px`,
          }}
        >
          <div style={{ ...rowStyle, color: COLORS.dim }}>
            <span>hero-loop</span>
            <span>done</span>
          </div>

          <div style={{ display: "grid", gap: s(14) }}>
            <div style={rowStyle}>
              <span style={{ color: COLORS.ink }}>social-clip</span>
              <span
                style={{
                  color: COLORS.phosphor,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {percent}%
              </span>
            </div>

            <div
              style={{
                height: s(4),
                borderRadius: s(4),
                overflow: "hidden",
                backgroundColor: COLORS.hairline,
              }}
            >
              <div
                style={{
                  width: `${progress * 100}%`,
                  height: "100%",
                  backgroundColor: COLORS.phosphor,
                }}
              />
            </div>
          </div>

          <div style={{ height: Math.round(mono * 1.6) }}>
            <FadeIn delayInFrames={36} durationInFrames={12}>
              <div style={{ ...rowStyle, width: panelWidth - s(68) }}>
                <span style={{ color: COLORS.muted }}>out/social-clip.mp4</span>
                <span style={{ color: COLORS.dim, whiteSpace: "nowrap" }}>
                  {width} × {height}
                </span>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </Beat>
  );
};

const PanelHeader: React.FC<{
  m: Metrics;
  label: string;
  trailing: string;
}> = ({ m, label, trailing }) => {
  const { s } = m;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${s(15)}px ${s(24)}px`,
        borderBottom: `1px solid ${COLORS.hairline}`,
        backgroundColor: COLORS.panelRaised,
        fontFamily: monoFamily,
        fontSize: s(17),
        color: COLORS.dim,
      }}
    >
      <span>{label}</span>
      <span>{trailing}</span>
    </div>
  );
};

/**
 * Beat container. Owns the handoff so no beat ever cross-dissolves on top of
 * the next one at the same coordinates — the outgoing beat is already lifting
 * away while the incoming beat is still rising into place.
 */
const Beat: React.FC<{
  m: Metrics;
  exitAt: number;
  children: ReactNode;
}> = ({ m, exitAt, children }) => {
  const frame = useCurrentFrame();
  const lift = m.s(170);
  const enterFade = enterProgress(frame, 0, BEAT_ENTER_FADE);
  const enterMove = enterProgress(frame, 0, BEAT_ENTER_MOVE);
  const exitFade = enterProgress(frame, exitAt, BEAT_EXIT_FADE);
  const exitMove = enterProgress(
    frame,
    exitAt,
    BEAT_EXIT_MOVE,
    EASING.editorial,
  );

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: m.safe.paddingLeft,
        paddingRight: m.safe.paddingRight,
        paddingTop: m.safe.paddingTop,
        paddingBottom: m.safe.paddingBottom,
        boxSizing: "border-box",
        opacity: enterFade * (1 - exitFade),
        translate: `0px ${(1 - enterMove) * lift - exitMove * lift}px`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** No drop shadow: on a #050505 stage it only reads as a grey ghost box while
 *  the panel springs in from zero opacity. */
const panelStyle: CSSProperties = {
  overflow: "hidden",
  border: `1px solid ${COLORS.hairline}`,
  backgroundColor: COLORS.panel,
};
