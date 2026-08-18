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

export type RoadmapItem = {
  label: string;
  /**
   * How far along this item is, 0 to 1. Only drawn on lanes with
   * `showProgress`, and the bar grows to this value rather than sitting at it.
   */
  progress?: number;
};

export type RoadmapLane = {
  title: string;
  items: RoadmapItem[];
  color?: string;
  /** Draws a tick on every item — for lanes that are done. */
  done?: boolean;
  /** Draws a growing progress bar inside each item. */
  showProgress?: boolean;
  /** Dashes the item borders — for lanes that have not started. */
  dashed?: boolean;
};

export type RoadmapLanesProps = {
  lanes?: RoadmapLane[];
  /** Heading above the lanes. Omit to drop it. */
  title?: string;
  /** Second the first lane's items arrive. */
  startAtSeconds?: number;
  /** Seconds between lanes. */
  laneStaggerSeconds?: number;
  /** Seconds between items inside a lane. */
  itemStaggerSeconds?: number;
  /** How long a progress bar takes to reach its value. */
  fillSeconds?: number;
  /**
   * Seconds the settled roadmap holds before it retreats. Omit to leave it up
   * for the rest of the scene.
   */
  holdSeconds?: number;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_LANES: RoadmapLane[] = [
  {
    title: "Shipped",
    color: "#9BD4A0",
    done: true,
    items: [{ label: "Caption presets" }, { label: "Render API" }, { label: "Theme tokens" }],
  },
  {
    title: "Building",
    color: "#E8B86D",
    showProgress: true,
    items: [
      { label: "Timeline scrubber", progress: 0.72 },
      { label: "Retry backoff", progress: 0.45 },
      { label: "Waveform atom", progress: 0.28 },
    ],
  },
  {
    title: "Planned",
    color: "#7A828F",
    dashed: true,
    items: [{ label: "Collaborative edits" }, { label: "Stem export" }, { label: "Mobile preview" }],
  },
];

/** Beat plan in seconds. Lane and item times come from the props. */
const T = {
  head: 0.1,
  headFor: 0.42,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * Three swimlanes of work, filling lane by lane: shipped items land ticked,
 * in-flight items land empty and then fill to their real progress, and planned
 * items arrive dashed and unlit.
 *
 * The fill is deliberately slower than the arrival and starts after it. A bar
 * that grows while its pill is still moving reads as one blurred event; letting
 * the pill settle first turns the progress into a second beat the eye can
 * actually follow.
 */
export const RoadmapLanes: React.FC<RoadmapLanesProps> = ({
  lanes = DEFAULT_LANES,
  title = "What we are building",
  startAtSeconds = 0.42,
  laneStaggerSeconds = 0.42,
  itemStaggerSeconds = 0.14,
  fillSeconds = 0.8,
  holdSeconds,
  accentColor = "#E8B86D",
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

  const boardW = Math.min(width - safe.paddingLeft - safe.paddingRight, 900 * u);
  const labelW = 132 * u;
  const gap = 12 * u;
  const laneH = 74 * u;

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
          width: boardW,
          opacity: 1 - exit,
          translate: `0 ${exit * 26 * u}px`,
        }}
      >
        {title ? (
          <div
            style={{
              marginBottom: 22 * u,
              color: palette.fg,
              fontSize: 30 * u,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              opacity: headIn,
              translate: `0 ${(1 - headIn) * 12 * u}px`,
            }}
          >
            {title}
          </div>
        ) : null}

        {lanes.map((lane, laneIndex) => {
          const laneAt = startAtSeconds + laneIndex * laneStaggerSeconds;
          const laneIn = ease(laneAt - 0.16, laneAt + 0.24);
          const color = lane.color ?? accentColor;
          // n items have n-1 gaps between them. Subtracting n inverted the
          // lane at 8+ items; the floor keeps a legible card at any count.
          const itemW = Math.max(
            60 * u,
            (boardW - labelW - gap * Math.max(0, lane.items.length - 1)) /
              Math.max(1, lane.items.length),
          );

          return (
            <div
              key={lane.title}
              style={{
                display: "flex",
                alignItems: "center",
                height: laneH,
                borderTop: laneIndex === 0 ? "none" : `1px solid ${palette.border}`,
              }}
            >
              <div
                style={{
                  width: labelW,
                  display: "flex",
                  alignItems: "center",
                  gap: 9 * u,
                  opacity: laneIn,
                  translate: `${(1 - laneIn) * -12 * u}px`,
                }}
              >
                <span
                  style={{
                    width: 7 * u,
                    height: 7 * u,
                    borderRadius: 999,
                    background: color,
                  }}
                />
                <span
                  style={{
                    color: palette.dim,
                    fontSize: 13.5 * u,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {lane.title}
                </span>
              </div>

              <div style={{ display: "flex", gap, flex: 1 }}>
                {lane.items.map((item, itemIndex) => {
                  const itemAt = laneAt + itemIndex * itemStaggerSeconds;
                  const arrive = spring({
                    frame: frame - at(itemAt),
                    fps,
                    config: { damping: 17, stiffness: 155, mass: 0.7 },
                  });
                  const fade = ease(itemAt, itemAt + 0.32);
                  // The bar starts once the pill has landed, not with it.
                  const fill = lane.showProgress
                    ? ease(itemAt + 0.3, itemAt + 0.3 + fillSeconds, EASING.editorial) *
                      (item.progress ?? 0)
                    : 0;

                  return (
                    <div
                      key={item.label}
                      style={{
                        width: itemW,
                        height: 46 * u,
                        borderRadius: 10 * u,
                        background: lane.dashed ? "transparent" : palette.band,
                        border: `1px ${lane.dashed ? "dashed" : "solid"} ${
                          lane.dashed ? palette.border : `${color}44`
                        }`,
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        gap: 8 * u,
                        padding: `0 ${11 * u}px`,
                        opacity: fade * (lane.dashed ? 0.72 : 1),
                        translate: `${(1 - arrive) * 16 * u}px`,
                      }}
                    >
                      {lane.showProgress ? (
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${fill * 100}%`,
                            background: `linear-gradient(90deg, ${color}30, ${color}18)`,
                            borderRight: fill > 0.02 ? `1px solid ${color}66` : "none",
                          }}
                        />
                      ) : null}

                      {lane.done ? (
                        <svg
                          width={14 * u}
                          height={14 * u}
                          viewBox="0 0 24 24"
                          fill="none"
                          style={{ flexShrink: 0, position: "relative" }}
                        >
                          <path
                            d="M5 12.5 L10 17.5 L19 7"
                            stroke={color}
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pathLength={1}
                            strokeDasharray={1}
                            strokeDashoffset={1 - fade}
                          />
                        </svg>
                      ) : null}

                      <span
                        style={{
                          position: "relative",
                          color: lane.dashed ? palette.dim : palette.fg,
                          fontSize: 14 * u,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.label}
                      </span>

                      {lane.showProgress ? (
                        <span
                          style={{
                            position: "relative",
                            marginLeft: "auto",
                            color,
                            fontSize: 12.5 * u,
                            fontWeight: 700,
                            fontVariantNumeric: "tabular-nums",
                            flexShrink: 0,
                          }}
                        >
                          {Math.round(fill * 100)}%
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
