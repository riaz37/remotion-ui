import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { EASING_ENTER, EASING_EXIT } from "@/remotion/lib/timing";

type MenuIcon = "grid" | "layers" | "queue" | "book";

type MenuItem = {
  label: string;
  icon: MenuIcon;
  /** Panel headline shown while this row is the active one. */
  panelTitle: string;
  panelDetail: string;
  panelRows: string[];
};

const ITEMS: MenuItem[] = [
  {
    label: "Components",
    icon: "grid",
    panelTitle: "127 in the registry",
    panelDetail: "Primitives and scenes",
    panelRows: ["text-reveal", "counter", "media-frame"],
  },
  {
    label: "Compositions",
    icon: "layers",
    panelTitle: "12 ready to render",
    panelDetail: "Scenes wired with transitions",
    panelRows: ["social-clip", "data-story", "podcast-clip"],
  },
  {
    label: "Render queue",
    icon: "queue",
    panelTitle: "2 jobs running",
    panelDetail: "H.264, 1080p, 30fps",
    panelRows: ["social-clip  68%", "data-story  queued", "hero-loop  done"],
  },
  {
    label: "Docs",
    icon: "book",
    panelTitle: "Install as source",
    panelDetail: "Own every frame in your repo",
    panelRows: ["npx remotion-ui add", "Props reference", "Theming"],
  },
];

/**
 * Frames the highlight lands on each row. The panel on the right follows the
 * highlight, so the right half of the frame carries motion instead of sitting
 * empty while the list settles.
 */
const ACTIVE_AT = [0, 44, 62, 80];

/**
 * Exit beat: rows leave staggered, mirroring the enter order.
 *
 * Timed to *straddle* the 90% sample of a 120-frame window (frame 108), not to
 * finish before it — opacity is gone by roughly 70% of an exit window, so the
 * previous 70 + 24 emptied the frame by frame 109 and ended on a black plate.
 * The window shell never leaves, so the last frame still has a frame in it.
 */
const EXIT_START = 92;
const EXIT_STAGGER = 5;
const EXIT_DURATION = 22;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const ICON_PATHS: Record<MenuIcon, string> = {
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  layers: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5",
  queue: "M4 6h16M4 12h10M4 18h7M17 15l4 3-4 3z",
  book: "M5 4h9a3 3 0 013 3v13H8a3 3 0 00-3 3zM8 8h7M8 12h7",
};

const Icon: React.FC<{ name: MenuIcon; size: number; color: string }> = ({
  name,
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path
      d={ICON_PATHS[name]}
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Menu of an actual tool: a sidebar whose selection drives a content panel. */
export const ToolMenuSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });

  const activeIndex = ACTIVE_AT.reduce(
    (acc, at, i) => (frame >= at ? i : acc),
    0,
  );
  const active = ITEMS[activeIndex];
  const activeSince = frame - ACTIVE_AT[activeIndex];

  const exitAt = (index: number) =>
    interpolate(
      frame,
      [
        EXIT_START + index * EXIT_STAGGER,
        EXIT_START + index * EXIT_STAGGER + EXIT_DURATION,
      ],
      [0, 1],
      { easing: EASING_EXIT, ...clamp },
    );

  const panelExit = exitAt(ITEMS.length);
  const radius = Math.round(width * 0.024);
  const railWidth = Math.round(width * 0.35);

  return (
    <AbsoluteFill
      style={{
        background: "#080810",
        padding: `${safe.paddingTop}px ${safe.paddingRight}px ${safe.paddingBottom}px ${safe.paddingLeft}px`,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderRadius: radius,
          overflow: "hidden",
          background: "#0b0f18",
          border: "1px solid rgba(148,163,184,0.16)",
        }}
      >
        {/* Window chrome — gives the list a product to belong to. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: scaleFont(14, width),
            padding: `${scaleFont(18, width)}px ${scaleFont(26, width)}px`,
            borderBottom: "1px solid rgba(148,163,184,0.14)",
            background: "rgba(148,163,184,0.05)",
          }}
        >
          {["#3f4756", "#3f4756", "#3f4756"].map((color, i) => (
            <span
              key={i}
              style={{
                width: scaleFont(14, width),
                height: scaleFont(14, width),
                borderRadius: 999,
                background: color,
              }}
            />
          ))}
          <span
            style={{
              marginLeft: scaleFont(12, width),
              color: "#8d97a8",
              fontSize: scaleFont(26, width),
              fontWeight: 500,
            }}
          >
            remotion-ui studio
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* Sidebar */}
          <div
            style={{
              width: railWidth,
              display: "grid",
              alignContent: "center",
              gap: scaleFont(10, width),
              padding: scaleFont(18, width),
              borderRight: "1px solid rgba(148,163,184,0.12)",
            }}
          >
            {ITEMS.map((item, i) => {
              const enterDelay = i * 6;
              const slide = interpolate(
                frame,
                [enterDelay, enterDelay + 18],
                [-120, 0],
                { easing: EASING_ENTER, ...clamp },
              );
              const enterOpacity = interpolate(
                frame,
                [enterDelay, enterDelay + 12],
                [0, 1],
                clamp,
              );
              const exitProgress = exitAt(i);
              const isActive = i === activeIndex;

              return (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: scaleFont(16, width),
                    padding: `${scaleFont(15, width)}px ${scaleFont(20, width)}px`,
                    borderRadius: Math.round(radius * 0.7),
                    background: isActive
                      ? "rgba(232,184,109,0.14)"
                      : "rgba(148,163,184,0.05)",
                    border: `1px solid ${isActive ? "rgba(232,184,109,0.42)" : "rgba(148,163,184,0.12)"}`,
                    color: isActive ? "#f4e3c4" : "#aeb7c6",
                    fontSize: scaleFont(30, width),
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    // Leaves the way it came in, so an exiting row never
                    // travels across the divider and onto the panel copy.
                    translate: `${slide - exitProgress * 160}px 0`,
                    opacity: enterOpacity * (1 - exitProgress),
                  }}
                >
                  <Icon
                    name={item.icon}
                    size={scaleFont(30, width)}
                    color={isActive ? "#e8b86d" : "#8d97a8"}
                  />
                  {item.label}
                </div>
              );
            })}
          </div>

          {/* Content panel — swaps with the highlighted row. */}
          <div
            style={{
              flex: 1,
              display: "grid",
              alignContent: "center",
              gap: scaleFont(12, width),
              padding: scaleFont(30, width),
              opacity:
                interpolate(frame, [10, 24], [0, 1], clamp) * (1 - panelExit),
            }}
          >
            <div
              key={active.label}
              style={{
                display: "grid",
                gap: scaleFont(12, width),
                opacity: interpolate(activeSince, [0, 10], [0, 1], clamp),
                translate: `0 ${interpolate(activeSince, [0, 14], [22, 0], { easing: EASING_ENTER, ...clamp })}px`,
              }}
            >
              <span
                style={{
                  color: "#e8b86d",
                  fontSize: scaleFont(26, width),
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {active.label}
              </span>
              <span
                style={{
                  color: "#f1f5f9",
                  fontSize: scaleFont(52, width),
                  fontWeight: 600,
                  lineHeight: 1.04,
                }}
              >
                {active.panelTitle}
              </span>
              <span
                style={{
                  color: "#8d97a8",
                  fontSize: scaleFont(28, width),
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {active.panelDetail}
              </span>
              <div
                style={{
                  marginTop: scaleFont(6, width),
                  display: "grid",
                  gap: scaleFont(8, width),
                }}
              >
                {active.panelRows.map((row, i) => (
                  <div
                    key={row}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: `${scaleFont(12, width)}px ${scaleFont(20, width)}px`,
                      borderRadius: Math.round(radius * 0.6),
                      background: "rgba(148,163,184,0.06)",
                      border: "1px solid rgba(148,163,184,0.1)",
                      color: i === 0 ? "#e2e8f0" : "#9aa4b4",
                      fontSize: scaleFont(26, width),
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      opacity: interpolate(
                        activeSince,
                        [4 + i * 4, 16 + i * 4],
                        [0, 1],
                        clamp,
                      ),
                    }}
                  >
                    {row}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
