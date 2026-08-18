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

export type GraphCommit = {
  message: string;
  /** Short hash shown in the gutter. Any length works; 7 reads as git. */
  hash: string;
  /** Lane index. 0 is the trunk; 1 and up are branches to its right. */
  lane?: number;
  /**
   * Index of the commit this one descends from. Defaults to the previous entry,
   * which is what you want for a straight run; point it further back to fork,
   * and set `mergeFrom` to bring a fork home.
   */
  parent?: number;
  /** Second lane this commit also descends from — draws the merge curve. */
  mergeFrom?: number;
  /** Tag or branch chip pinned to the row. */
  ref?: string;
};

export type CommitGraphProps = {
  commits?: GraphCommit[];
  /** Text in the window's title bar. Omit to drop the chrome header. */
  windowTitle?: string;
  /** Second the first commit lands. */
  startAtSeconds?: number;
  /** Seconds between commits. The edge draws over this same gap. */
  stepSeconds?: number;
  /**
   * Seconds the finished graph holds before it retreats. Omit to leave it up
   * for the rest of the scene.
   */
  holdSeconds?: number;
  /** Colour of the trunk. Branch lanes take `laneColors`. */
  accentColor?: string;
  laneColors?: string[];
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_COMMITS: GraphCommit[] = [
  { message: "Seed the registry manifest", hash: "9c41f0a" },
  { message: "Add render queue worker", hash: "3ab77e2" },
  { message: "Branch: retry backoff", hash: "d0e91c4", lane: 1, parent: 1 },
  { message: "Cap retries at five", hash: "51b2fa8", lane: 1 },
  { message: "Ship caption presets", hash: "7f30dd1", lane: 0, parent: 1 },
  {
    message: "Merge retry backoff",
    hash: "b8c4e05",
    lane: 0,
    parent: 4,
    mergeFrom: 3,
    ref: "main",
  },
];

/** Beat plan in seconds. Commit times come from the props. */
const T = {
  window: 0,
  windowFor: 0.46,
  chrome: 0.14,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const DEFAULT_LANE_COLORS = ["#E8B86D", "#7DD3E8", "#C99BE8", "#9BD4A0"];

/**
 * A branch graph that draws itself: every edge grows from its parent toward the
 * commit it feeds, the dot pops the moment the line arrives, and the message
 * beside it fades up a beat later so the eye follows the rail rather than
 * jumping to the text.
 *
 * Edges use `pathLength={1}`, so the dash offset that reveals them is the same
 * number as the commit's progress regardless of whether the segment is a short
 * vertical hop or a long merge curve — a fork and a straight run draw at the
 * same apparent speed.
 */
export const CommitGraph: React.FC<CommitGraphProps> = ({
  commits = DEFAULT_COMMITS,
  windowTitle = "git log --graph --oneline",
  startAtSeconds = 0.34,
  stepSeconds = 0.36,
  holdSeconds,
  accentColor = "#E8B86D",
  laneColors = DEFAULT_LANE_COLORS,
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

  const windowIn = spring({
    frame: frame - at(T.window),
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });
  const open = ease(T.window, T.window + T.windowFor, EASING.editorial);
  const chromeIn = ease(T.chrome, T.chrome + 0.38);

  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const windowW = Math.min(width - safe.paddingLeft - safe.paddingRight, 860 * u);
  const rowH = 48 * u;
  const laneW = 30 * u;
  const gutterX = 26 * u;
  const lanes = commits.reduce((max, commit) => Math.max(max, commit.lane ?? 0), 0) + 1;
  const graphW = gutterX + lanes * laneW;
  const bodyH = rowH * commits.length;
  const dotR = 6.5 * u;

  const laneColor = (lane: number) =>
    lane === 0 ? accentColor : laneColors[lane % laneColors.length];

  const rowY = (index: number) => index * rowH + rowH / 2;
  const laneX = (lane: number) => gutterX + lane * laneW;

  /** Reveal of the edge feeding commit `index`, and of the commit itself. */
  const arrivalOf = (index: number) =>
    ease(
      startAtSeconds + index * stepSeconds,
      startAtSeconds + (index + 1) * stepSeconds,
      EASING.editorial,
    );

  const edgePath = (fromIndex: number, toIndex: number) => {
    const from = commits[fromIndex];
    const to = commits[toIndex];
    const x1 = laneX(from.lane ?? 0);
    const y1 = rowY(fromIndex);
    const x2 = laneX(to.lane ?? 0);
    const y2 = rowY(toIndex);
    if (x1 === x2) return `M ${x1} ${y1} L ${x2} ${y2}`;
    // A fork leaves its parent vertically and arrives vertically, so the curve
    // reads as a lane change rather than a diagonal shortcut.
    const bend = (y2 - y1) * 0.55;
    return `M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`;
  };

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
          width: windowW,
          borderRadius: 18 * u,
          background: palette.window,
          border: `1px solid ${palette.border}`,
          boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${24 * u}px ${
            60 * u
          }px ${palette.shadow}`,
          overflow: "hidden",
          clipPath: `inset(0 0 ${(1 - open) * 100}% 0 round ${18 * u}px)`,
          opacity: 1 - exit,
          translate: `0 ${(1 - windowIn) * 22 * u + exit * 30 * u}px`,
        }}
      >
        {windowTitle ? (
          <div
            style={{
              height: 40 * u,
              display: "flex",
              alignItems: "center",
              gap: 8 * u,
              padding: `0 ${16 * u}px`,
              background: palette.header,
              borderBottom: `1px solid ${palette.border}`,
              opacity: chromeIn,
            }}
          >
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                style={{
                  width: 9 * u,
                  height: 9 * u,
                  borderRadius: 999,
                  background: palette.faint,
                }}
              />
            ))}
            <span
              style={{
                marginLeft: 10 * u,
                color: palette.dim,
                fontSize: 13.5 * u,
                fontWeight: 500,
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {windowTitle}
            </span>
          </div>
        ) : null}

        <div style={{ position: "relative", height: bodyH, padding: `${10 * u}px 0` }}>
          <svg
            width={graphW}
            height={bodyH}
            viewBox={`0 0 ${graphW} ${bodyH}`}
            style={{ position: "absolute", left: 18 * u, top: 10 * u }}
          >
            {commits.map((commit, index) => {
              if (index === 0) return null;
              const progress = arrivalOf(index);
              if (progress <= 0) return null;
              const parent = commit.parent ?? index - 1;
              const lane = commit.lane ?? 0;
              const edges = [{ from: parent, stroke: laneColor(lane) }];
              if (commit.mergeFrom !== undefined) {
                edges.push({
                  from: commit.mergeFrom,
                  stroke: laneColor(commits[commit.mergeFrom].lane ?? 0),
                });
              }
              return edges.map((edge) => (
                <path
                  key={`${index}-${edge.from}`}
                  d={edgePath(edge.from, index)}
                  fill="none"
                  stroke={edge.stroke}
                  strokeWidth={2.2 * u}
                  strokeLinecap="round"
                  opacity={0.85}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - progress}
                />
              ));
            })}

            {commits.map((commit, index) => {
              const progress = index === 0 ? ease(startAtSeconds - 0.24, startAtSeconds) : arrivalOf(index);
              // The dot only exists once its edge has arrived, so a commit can
              // never appear ahead of the line that feeds it.
              const pop = interpolate(progress, [0.82, 1], [0, 1], clamp);
              if (pop <= 0) return null;
              const color = laneColor(commit.lane ?? 0);
              return (
                <circle
                  key={commit.hash}
                  cx={laneX(commit.lane ?? 0)}
                  cy={rowY(index)}
                  r={dotR * (0.6 + pop * 0.4)}
                  fill={palette.window}
                  stroke={color}
                  strokeWidth={2.6 * u}
                  opacity={pop}
                />
              );
            })}
          </svg>

          {commits.map((commit, index) => {
            const progress = index === 0 ? ease(startAtSeconds - 0.24, startAtSeconds) : arrivalOf(index);
            const textIn = interpolate(progress, [0.86, 1], [0, 1], clamp);
            return (
              <div
                key={commit.hash}
                style={{
                  position: "absolute",
                  left: 18 * u + graphW + 14 * u,
                  right: 20 * u,
                  top: 10 * u + rowY(index) - 12 * u,
                  height: 24 * u,
                  display: "flex",
                  alignItems: "center",
                  gap: 12 * u,
                  opacity: textIn,
                  translate: `${(1 - textIn) * 14 * u}px`,
                }}
              >
                <span
                  style={{
                    color: laneColor(commit.lane ?? 0),
                    fontSize: 13.5 * u,
                    fontWeight: 600,
                    fontFamily: "ui-monospace, monospace",
                    flexShrink: 0,
                  }}
                >
                  {commit.hash}
                </span>
                <span
                  style={{
                    color: palette.fg,
                    fontSize: 15.5 * u,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {commit.message}
                </span>
                {commit.ref ? (
                  <span
                    style={{
                      flexShrink: 0,
                      padding: `${2.5 * u}px ${8 * u}px`,
                      borderRadius: 6 * u,
                      background: `${accentColor}22`,
                      border: `1px solid ${accentColor}66`,
                      color: accentColor,
                      fontSize: 12 * u,
                      fontWeight: 600,
                    }}
                  >
                    {commit.ref}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
