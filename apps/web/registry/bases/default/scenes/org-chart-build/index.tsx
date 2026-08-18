import { useMemo } from "react";
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

  /* The whole layout is a function of the tree and the stage, not of the frame.
   * It used to be four closures called from inside the render: `centerOf`
   * recursed the subtree on every reference, `orderInLevel` re-sorted a whole
   * level per node, and both ran again for the connector and for the card — so
   * a 9-node chart re-walked itself dozens of times a frame. Keyed on a
   * signature of the tree rather than on `nodes`, because a caller passing an
   * array literal hands this a new reference every frame. */
  const signature = nodes
    .map((node) => `${node.name}:${node.parent ?? "-"}`)
    .join("|");

  const layout = useMemo(() => {
    const childIndices: number[][] = nodes.map(() => []);
    nodes.forEach((node, index) => {
      const parent = node.parent;
      if (parent !== undefined && parent !== index && nodes[parent] !== undefined) {
        childIndices[parent].push(index);
      }
    });

    /* Depth walks up the parent chain iteratively and remembers where it has
     * been. `parent` is a public prop with no validation behind it, so a cycle
     * — or a chain long enough to matter — would otherwise recurse until the
     * stack ran out, in a render that runs once per frame. */
    const depths = nodes.map((_, index) => {
      const seen = new Set<number>([index]);
      let depth = 0;
      let cursor = nodes[index].parent;
      while (cursor !== undefined && nodes[cursor] !== undefined && !seen.has(cursor)) {
        seen.add(cursor);
        depth += 1;
        cursor = nodes[cursor].parent;
      }
      return depth;
    });

    const maxDepth = depths.reduce((max, depth) => Math.max(max, depth), 0);
    const leaves = nodes.reduce<number[]>(
      (list, _, index) => (childIndices[index].length === 0 ? [...list, index] : list),
      [],
    );
    const leafSpan = chartW / Math.max(1, leaves.length);

    /* Centres resolve deepest-first rather than by recursion: a child always
     * carries a greater depth than its parent, so one pass in that order has
     * every child's centre already in hand — and it terminates whatever the
     * caller passes. Leaves sit on their own slot, parents over their span. */
    const centers = nodes.map(() => 0);
    const deepestFirst = nodes
      .map((_, index) => index)
      .sort((a, b) => depths[b] - depths[a]);
    for (const index of deepestFirst) {
      const children = childIndices[index];
      if (children.length === 0) {
        centers[index] = (leaves.indexOf(index) + 0.5) * leafSpan;
        continue;
      }
      const spans = children.map((child) => centers[child]);
      centers[index] = (Math.min(...spans) + Math.max(...spans)) / 2;
    }

    // Siblings inside a level are ordered by their own centres, left to right.
    const orderInLevel = nodes.map(() => 0);
    for (let depth = 0; depth <= maxDepth; depth += 1) {
      nodes
        .map((_, index) => index)
        .filter((index) => depths[index] === depth)
        .sort((a, b) => centers[a] - centers[b])
        .forEach((index, position) => {
          orderInLevel[index] = position;
        });
    }

    return {
      depths,
      maxDepth,
      centers,
      nodeW: Math.min(190 * u, leafSpan - 16 * u),
      landings: nodes.map(
        (_, index) =>
          startAtSeconds +
          depths[index] * levelStaggerSeconds +
          orderInLevel[index] * siblingStaggerSeconds,
      ),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    signature,
    chartW,
    u,
    startAtSeconds,
    levelStaggerSeconds,
    siblingStaggerSeconds,
  ]);

  const { depths, maxDepth, centers, nodeW, landings } = layout;

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
              const landing = landings[index];
              const draw = ease(
                landing - T.connectorLead,
                landing + 0.06,
                EASING.editorial,
              );
              if (draw <= 0) return null;
              const x1 = centers[node.parent];
              const y1 = rowY(depths[node.parent]) + nodeH;
              const x2 = centers[index];
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
            const landing = landings[index];
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
                  left: centers[index] - nodeW / 2,
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
