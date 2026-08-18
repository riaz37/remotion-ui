import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";
import { samplePath } from "@/remotion/lib/path-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type PipeStage = {
  /** Stage name, e.g. "Transcode". */
  label: string;
  /** Optional second line — the queue, the worker, the region. */
  detail?: string;
};

export type DataFlowPipesProps = {
  /** Stages the payload passes through, in order. Two to five read best. */
  stages?: PipeStage[];
  /** Unit counted at each stage, shown next to the tally. */
  unit?: string;
  /** How many payloads are pushed through the pipeline. */
  packets?: number;
  /**
   * Seconds the drained pipeline holds before it retreats. Omit to leave it on
   * screen for the rest of the scene.
   */
  holdSeconds?: number;
  backgroundColor?: string;
  accentColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_STAGES: PipeStage[] = [
  { label: "Ingest", detail: "s3://raw-takes" },
  { label: "Transcode", detail: "h264 · 4 workers" },
  { label: "Caption", detail: "whisper-large" },
  { label: "Deliver", detail: "edge cache" },
];

/** Beat plan in seconds. */
const T = {
  nodes: 0,
  nodeStagger: 0.12,
  pipes: 0.5,
  pipeStagger: 0.16,
  firstPacket: 1.15,
  /** Gap between payloads leaving the source. */
  emit: 0.26,
  /** Time a payload spends in one pipe. */
  hop: 0.52,
  /** How long a node stays lit after a payload lands on it. */
  pulse: 0.5,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const CheckGlyph: React.FC<{
  size: number;
  color: string;
  progress: number;
}> = ({ size, color, progress }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4.8 12.6l4.9 4.9 9.5-10.4"
      stroke={color}
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={22}
      strokeDashoffset={22 * (1 - progress)}
    />
  </svg>
);

/**
 * A pipeline actually running rather than dots looping on a static graph:
 * stages come up in dependency order, the pipes draw between them, and then a
 * stream of payloads travels hop by hop — lighting each stage as it lands and
 * ticking that stage's tally — until the last one drains and completes.
 */
export const DataFlowPipes: React.FC<DataFlowPipesProps> = ({
  stages = DEFAULT_STAGES,
  unit = "clips",
  packets = 9,
  holdSeconds,
  backgroundColor,
  accentColor = "#2DD4BF",
  theme = "dark",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  /** Seconds elapsed, stretched by `speed`, so every beat below is in seconds. */
  const now = ((frame / fps) * speed);
  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });

  const stage = {
    x: safe.paddingLeft,
    y: safe.paddingTop,
    w: width - safe.paddingLeft - safe.paddingRight,
    h: height - safe.paddingTop - safe.paddingBottom,
  };
  const portrait = height > width;
  const list = stages.slice(0, 5);
  const count = list.length;
  const hops = Math.max(count - 1, 1);

  // Landscape wraps four or five stages onto two rows. A single band across the
  // middle left the top third and bottom third of the frame empty and forced
  // the node labels down to a few pixels at tile size.
  const columns = portrait ? 1 : count <= 3 ? count : Math.ceil(count / 2);
  const rowCount = Math.ceil(count / columns);
  const cellW = stage.w / columns;
  const cellH = stage.h / rowCount;

  const u = portrait
    ? Math.min(stage.w / 560, stage.h / 900)
    : Math.min(stage.w / 780, stage.h / 420);
  const nodeW = Math.min((portrait ? 440 : 340) * u, cellW - 40 * u);
  const nodeH = Math.min(170 * u, cellH - 46 * u);

  /** Serpentine placement: each row runs back the way the last one came, so the
      flow never jumps across the frame between rows. */
  const center = (index: number) => {
    const row = Math.floor(index / columns);
    const slot = index % columns;
    const column = row % 2 === 0 ? slot : columns - 1 - slot;
    // With a single row the stages alternate above and below the mid line, which
    // is what gives the run its plumbing shape.
    const swing = rowCount === 1 && count > 2 ? stage.h * 0.085 : 0;
    return {
      x: (column + 0.5) * cellW,
      y: (row + 0.5) * cellH + (index % 2 === 0 ? -swing : swing),
    };
  };

  /** Pipe between two stages, leaving and entering along whichever axis
      dominates the gap so the run reads as plumbing rather than a diagonal. */
  const pipePath = (index: number) => {
    const from = center(index);
    const to = center(index + 1);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const sx = dx < 0 ? -1 : 1;
    const sy = dy < 0 ? -1 : 1;
    const exit = horizontal
      ? { x: from.x + (sx * nodeW) / 2, y: from.y }
      : { x: from.x, y: from.y + (sy * nodeH) / 2 };
    const entry = horizontal
      ? { x: to.x - (sx * nodeW) / 2, y: to.y }
      : { x: to.x, y: to.y - (sy * nodeH) / 2 };
    const bend =
      (horizontal
        ? Math.abs(entry.x - exit.x)
        : Math.abs(entry.y - exit.y)) * 0.55;
    const c1 = horizontal
      ? { x: exit.x + sx * bend, y: exit.y }
      : { x: exit.x, y: exit.y + sy * bend };
    const c2 = horizontal
      ? { x: entry.x - sx * bend, y: entry.y }
      : { x: entry.x, y: entry.y - sy * bend };
    return `M ${exit.x} ${exit.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${entry.x} ${entry.y}`;
  };

  const pipes = Array.from({ length: hops }, (_, index) => pipePath(index));

  /** Seconds at which payload `k` enters hop `h` (h = 0 leaves the source). */
  const departure = (packet: number, hop: number) =>
    T.firstPacket + packet * T.emit + hop * T.hop;
  const lastArrival = departure(packets - 1, hops);

  const inFlight = Array.from({ length: packets }, (_, k) => {
    const elapsed = now - departure(k, 0);
    if (elapsed < 0) {
      return null;
    }
    const hop = Math.floor(elapsed / T.hop);
    if (hop >= hops) {
      return null;
    }
    const progress = elapsed / T.hop - hop;
    const point = samplePath(pipes[hop]!, progress);
    return { key: k, hop, progress, point };
  }).filter(Boolean) as {
    key: number;
    hop: number;
    progress: number;
    point: { x: number; y: number };
  }[];

  /** Payloads that have reached stage `index`, and how hot that landing is. */
  const arrivals = (index: number) => {
    let tally = 0;
    let heat = 0;
    for (let k = 0; k < packets; k += 1) {
      const landed = departure(k, index);
      if (now >= landed) {
        tally += 1;
        heat = Math.max(
          heat,
          interpolate(now, [landed, landed + T.pulse], [1, 0], clamp),
        );
      }
    }
    return { tally, heat };
  };

  const drained = ease(lastArrival, lastArrival + 0.45);
  const strokeW = 3.2 * u;

  // Exits accelerate away; entrances decelerate in. Never ease-out an exit.
  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(
          frame,
          [at(holdSeconds), at(holdSeconds + T.exitFor)],
          [0, 1],
          { easing: EASING.exit, ...clamp },
        );

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor ?? palette.page,
        fontFamily,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${accentColor}14, transparent 72%)`,
          opacity: 1 - exit,
        }}
      />

      <svg
        width={width}
        height={height}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          opacity: 1 - exit,
          translate: `0 ${exit * 26 * u}px`,
        }}
      >
        <g transform={`translate(${stage.x} ${stage.y})`}>
          {pipes.map((d, index) => {
            const draw = ease(
              T.pipes + index * T.pipeStagger,
              T.pipes + index * T.pipeStagger + 0.55,
            );
            const carrying = inFlight.some((packet) => packet.hop === index);
            return (
              <g key={`pipe-${index}`}>
                <path
                  d={d}
                  fill="none"
                  stroke={palette.border}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - draw}
                />
                <path
                  d={d}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  opacity={draw * (carrying ? 0.5 : 0.16)}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - draw}
                />
              </g>
            );
          })}

          {inFlight.map((packet) => (
            <g key={`packet-${packet.key}`}>
              {[0.16, 0.08, 0].map((lag, index) => {
                const trail = samplePath(
                  pipes[packet.hop]!,
                  Math.max(packet.progress - lag, 0),
                );
                const radius = (index === 2 ? 8.5 : 6.5 - index) * u;
                return (
                  <circle
                    key={lag}
                    cx={trail.x}
                    cy={trail.y}
                    r={radius}
                    fill={accentColor}
                    opacity={index === 2 ? 1 : 0.22 + index * 0.14}
                  />
                );
              })}
            </g>
          ))}
        </g>
      </svg>

      <div
        style={{
          position: "absolute",
          left: stage.x,
          top: stage.y,
          width: stage.w,
          height: stage.h,
          opacity: 1 - exit,
          translate: `0 ${exit * 26 * u}px`,
        }}
      >
        {list.map((node, index) => {
          const point = center(index);
          const enter = spring({
            frame: frame - at(T.nodes + index * T.nodeStagger),
            fps,
            config: { damping: 16, stiffness: 140, mass: 0.7 },
          });
          const { tally, heat } = arrivals(index);
          const isSink = index === count - 1;
          const complete = isSink ? drained : 0;

          return (
            <div
              key={node.label}
              style={{
                position: "absolute",
                left: point.x - nodeW / 2,
                top: point.y - nodeH / 2,
                width: nodeW,
                height: nodeH,
                borderRadius: 18 * u,
                background: palette.window,
                border: `1px solid ${
                  heat > 0.02 || complete > 0 ? `${accentColor}99` : palette.border
                }`,
                boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${
                  16 * u
                }px ${46 * u}px ${palette.shadow}, 0 0 ${
                  38 * u * heat
                }px ${accentColor}44`,
                opacity: enter,
                scale: `${
                  interpolate(enter, [0, 1], [0.9, 1], {
                    output: "perceptual-scale",
                    ...clamp,
                  }) +
                  heat * 0.02
                }`,
                padding: `${16 * u}px ${18 * u}px`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 6 * u,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9 * u,
                  color: palette.fg,
                  fontSize: 25 * u,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                <span
                  style={{
                    width: 9 * u,
                    height: 9 * u,
                    borderRadius: "50%",
                    background: accentColor,
                    opacity: 0.3 + heat * 0.7,
                    boxShadow: `0 0 ${12 * u * heat}px ${accentColor}`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ whiteSpace: "nowrap" }}>{node.label}</span>
                {complete > 0 ? (
                  <span style={{ marginLeft: "auto", display: "flex" }}>
                    <CheckGlyph
                      size={22 * u}
                      color={accentColor}
                      progress={complete}
                    />
                  </span>
                ) : null}
              </div>
              {node.detail ? (
                <div
                  style={{
                    color: palette.faint,
                    fontSize: 17 * u,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {node.detail}
                </div>
              ) : null}
              <div
                style={{
                  marginTop: 2 * u,
                  color: tally > 0 ? palette.dim : palette.faint,
                  fontSize: 18 * u,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {tally} {unit}
              </div>
              {/* Fill line — how much of the stream this stage has seen */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  height: 3 * u,
                  width: `${(tally / packets) * 100}%`,
                  background: accentColor,
                  opacity: 0.8,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
