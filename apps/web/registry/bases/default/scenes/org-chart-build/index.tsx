import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type OrgNode = {
  name: string;
  /** Line under the name. */
  role?: string;
  /**
   * Index of this node's parent in the same array. Omit for the root. Parents
   * must appear before their children.
   */
  parent?: number;
  /** Node accent. Falls back to the level's colour. */
  color?: string;
};

export type OrgChartBuildProps = {
  nodes?: OrgNode[];
  /** Heading above the chart. Omit to drop it. */
  title?: string;
  /** Second the root lands. */
  startAtSeconds?: number;
  /** Seconds between levels. */
  levelStaggerSeconds?: number;
  /** Seconds between siblings inside a level. */
  siblingStaggerSeconds?: number;
  /**
   * Seconds the finished chart holds before it retreats. Omit to leave it up
   * for the rest of the scene.
   */
  holdSeconds?: number;
  accentColor?: string;
  /** One colour per depth. Deeper levels reuse the last entry. */
  levelColors?: string[];
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_NODES: OrgNode[] = [
  { name: "Ada Okonjo", role: "Founder" },
  { name: "Piotr Nowak", role: "Engineering", parent: 0 },
  { name: "Dai Nakamura", role: "Design", parent: 0 },
  { name: "Sam Rhodes", role: "Infrastructure", parent: 1 },
  { name: "Kit Alvarez", role: "Rendering", parent: 1 },
  { name: "Runa Sørensen", role: "Systems", parent: 2 },
  { name: "Lea Fontaine", role: "Motion", parent: 2 },
];

const DEFAULT_LEVEL_COLORS = ["#E8B86D", "#7DD3E8", "#C99BE8"];

/** Beat plan in seconds. Node times come from the props. */
const T = {
  head: 0.06,
  headFor: 0.4,
  /** A connector draws over the gap before its child lands. */
  connectorLead: 0.34,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * A hierarchy that assembles top-down: each level's connectors draw down from
 * the parents that are already standing, and the nodes land on the ends of the
 * lines a beat later — so the chart builds the way it would be drawn by hand
 * rather than fading in as a finished diagram.
 *
 * Positions come from a leaf walk, not a grid: leaves are spread evenly and
 * every parent centres over the span of its own children, which keeps a lopsided
 * tree balanced without any node needing to know its siblings' widths.
 */
export const OrgChartBuild: React.FC<OrgChartBuildProps> = ({
  nodes = DEFAULT_NODES,
  title = "How the team is wired",
  startAtSeconds = 0.34,
  levelStaggerSeconds = 0.62,
  siblingStaggerSeconds = 0.12,
  holdSeconds,
  accentColor = "#E8B86D",
  levelColors = DEFAULT_LEVEL_COLORS,
  backgroundColor,
  theme = "dark",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });

  const portrait = height > width;
  const u = portrait
    ? Math.min(width / 620, height / 1120)
    : Math.min(width / 1280, height / 720);

  const headIn = ease(T.head, T.head + T.headFor);

  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const chartW = Math.min(width - safe.paddingLeft - safe.paddingRight, 900 * u);
  const nodeH = 54 * u;
  const levelH = 92 * u;

  const childrenOf = (index: number) =>
    nodes.reduce<number[]>((list, node, nodeIndex) => {
      if (node.parent === nodeIndex) return list;
      return node.parent === index ? [...list, nodeIndex] : list;
    }, []);

  const depthOf = (index: number): number => {
    const parent = nodes[index].parent;
    return parent === undefined ? 0 : depthOf(parent) + 1;
  };

  const depths = nodes.map((_, index) => depthOf(index));
  const maxDepth = depths.reduce((max, depth) => Math.max(max, depth), 0);
  const leaves = nodes.reduce<number[]>(
    (list, _, index) => (childrenOf(index).length === 0 ? [...list, index] : list),
    [],
  );
  const leafSpan = chartW / Math.max(1, leaves.length);
  const nodeW = Math.min(190 * u, leafSpan - 16 * u);

  /** Centre of a node: leaves sit on their own slot, parents over their span. */
  const centerOf = (index: number): number => {
    const children = childrenOf(index);
    if (children.length === 0) {
      return (leaves.indexOf(index) + 0.5) * leafSpan;
    }
    const spans = children.map(centerOf);
    return (Math.min(...spans) + Math.max(...spans)) / 2;
  };

  /** Siblings inside a level are ordered by their own centres, left to right. */
  const orderInLevel = (index: number) => {
    const level = depths
      .map((depth, nodeIndex) => ({ depth, nodeIndex }))
      .filter((entry) => entry.depth === depths[index])
      .sort((a, b) => centerOf(a.nodeIndex) - centerOf(b.nodeIndex));
    return level.findIndex((entry) => entry.nodeIndex === index);
  };

  const landingOf = (index: number) =>
    startAtSeconds +
    depths[index] * levelStaggerSeconds +
    orderInLevel(index) * siblingStaggerSeconds;

  const chartH = (maxDepth + 1) * levelH;
  const rowY = (depth: number) => depth * levelH;

  return (
    <AbsoluteFill
      style={{
        background: backgroundColor ?? palette.page,
        fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `${safe.paddingTop}px ${safe.paddingRight}px`,
      }}
    >
      <div
        style={{
          width: chartW,
          opacity: 1 - exit,
          translate: `0 ${exit * 26 * u}px`,
        }}
      >
        {title ? (
          <div
            style={{
              marginBottom: 18 * u,
              color: palette.fg,
              fontSize: 28 * u,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              opacity: headIn,
              translate: `0 ${(1 - headIn) * 12 * u}px`,
            }}
          >
            {title}
          </div>
        ) : null}

        <div style={{ position: "relative", height: chartH }}>
          <svg
            width={chartW}
            height={chartH}
            viewBox={`0 0 ${chartW} ${chartH}`}
            style={{ position: "absolute", inset: 0 }}
          >
            {nodes.map((node, index) => {
              if (node.parent === undefined) return null;
              const landing = landingOf(index);
              const draw = ease(
                landing - T.connectorLead,
                landing + 0.06,
                EASING.editorial,
              );
              if (draw <= 0) return null;
              const x1 = centerOf(node.parent);
              const y1 = rowY(depths[node.parent]) + nodeH;
              const x2 = centerOf(index);
              const y2 = rowY(depths[index]);
              const mid = (y1 + y2) / 2;
              const color =
                node.color ??
                levelColors[Math.min(depths[index], levelColors.length - 1)];
              // An elbow, not a diagonal: org charts are read as columns, and a
              // straight line between two boxes reads as a relationship of a
              // different kind entirely.
              return (
                <path
                  key={`edge-${index}`}
                  d={`M ${x1} ${y1} L ${x1} ${mid} L ${x2} ${mid} L ${x2} ${y2}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.8 * u}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.6}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - draw}
                />
              );
            })}
          </svg>

          {nodes.map((node, index) => {
            const landing = landingOf(index);
            const pop = spring({
              frame: frame - at(landing),
              fps,
              config: { damping: 16, stiffness: 165, mass: 0.65 },
            });
            const fade = ease(landing, landing + 0.3);
            const color =
              node.color ?? levelColors[Math.min(depths[index], levelColors.length - 1)];

            return (
              <div
                key={node.name}
                style={{
                  position: "absolute",
                  left: centerOf(index) - nodeW / 2,
                  top: rowY(depths[index]),
                  width: nodeW,
                  height: nodeH,
                  borderRadius: 11 * u,
                  background: palette.window,
                  border: `1px solid ${color}${depths[index] === 0 ? "88" : "44"}`,
                  boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${8 * u}px ${
                    22 * u
                  }px ${palette.shadow}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  padding: `0 ${12 * u}px`,
                  opacity: fade,
                  scale: `${0.9 + pop * 0.1}`,
                }}
              >
                <div
                  style={{
                    color: palette.fg,
                    fontSize: 15 * u,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {node.name}
                </div>
                {node.role ? (
                  <div
                    style={{
                      marginTop: 2 * u,
                      color: depths[index] === 0 ? accentColor : palette.dim,
                      fontSize: 12.5 * u,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {node.role}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
