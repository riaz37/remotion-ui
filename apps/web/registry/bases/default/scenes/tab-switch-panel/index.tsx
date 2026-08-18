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

export type PanelRow = {
  label: string;
  value: string;
};

export type PanelTab = {
  /** Text on the tab itself. Keep it to a word or two — tabs share the width
   * evenly, so one long label shrinks every other tab's breathing room. */
  label: string;
  /** Headline inside the panel. */
  title: string;
  /** Supporting line under the headline. */
  summary?: string;
  rows?: PanelRow[];
};

export type TabSwitchPanelProps = {
  tabs?: PanelTab[];
  /** Text in the window's title bar. Omit to drop the chrome header. */
  windowTitle?: string;
  /** Tab shown when the scene opens. */
  startIndex?: number;
  /** Second the first switch fires. */
  firstSwitchAtSeconds?: number;
  /** Seconds between switches after the first. */
  switchEverySeconds?: number;
  /** How long one tab-to-tab move takes. */
  transitionSeconds?: number;
  /**
   * Seconds the last panel holds before the window retreats. Omit to leave it
   * on screen for the rest of the scene.
   */
  holdSeconds?: number;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_TABS: PanelTab[] = [
  {
    label: "Overview",
    title: "1,284 renders",
    summary: "Up 18% against last week.",
    rows: [
      { label: "Queued", value: "12" },
      { label: "Median render", value: "41s" },
      { label: "Failures", value: "0.4%" },
    ],
  },
  {
    label: "Renders",
    title: "launch-teaser.mp4",
    summary: "1080p · 30fps · finished 2m ago.",
    rows: [
      { label: "Frames", value: "1,800" },
      { label: "Codec", value: "H.264" },
      { label: "Output", value: "68 MB" },
    ],
  },
  {
    label: "Team",
    title: "9 collaborators",
    summary: "Three joined this month.",
    rows: [
      { label: "Editors", value: "5" },
      { label: "Reviewers", value: "3" },
      { label: "Owners", value: "1" },
    ],
  },
  {
    label: "Billing",
    title: "Studio plan",
    summary: "Renews on 12 March.",
    rows: [
      { label: "Seats", value: "9 of 12" },
      { label: "Render minutes", value: "740" },
      { label: "Next invoice", value: "$312" },
    ],
  },
];

/** Beat plan in seconds. Switch times come from the props; these shape the
 * window's own arrival and departure. */
const T = {
  window: 0,
  windowFor: 0.5,
  chrome: 0.16,
  /** First tab's panel settles before any switching starts. */
  panel: 0.3,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * An app window whose tabs actually switch: the pill glides along the tab bar
 * while the outgoing panel slides off and the incoming one arrives behind it,
 * its rows trailing the headline slightly so the panel reads as one object
 * moving rather than a stack of independent fades.
 *
 * Tabs share the bar width evenly, which is what lets the pill's travel be pure
 * arithmetic — no text measurement, so the indicator can never drift out of
 * register with the label it is under.
 */
export const TabSwitchPanel: React.FC<TabSwitchPanelProps> = ({
  tabs = DEFAULT_TABS,
  windowTitle = "Northstar Studio",
  startIndex = 0,
  firstSwitchAtSeconds = 0.95,
  switchEverySeconds = 0.9,
  transitionSeconds = 0.5,
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
  // D1. Authored against a 1280x720 reference, u resolves to 0.75 on the 960
  // docs stage, so a 15-unit label landed at 11px — 3.6px once the contact
  // sheet reduces the stage 3.1x. The reference is the whole design's scale, so
  // shrinking it grows the layout into the margin it was leaving empty and
  // lifts every tier of type with it, instead of hand-tuning font sizes against
  // a layout that stays too small.
  const u = portrait
    ? Math.min(width / 496, height / 896)
    : Math.min(width / 1024, height / 576);

  // The scene walks forward from `startIndex` to the last tab and stops; it
  // does not wrap, so a continuous position can stand in for both the pill and
  // the panel carousel without ever having to jump back across the bar.
  // startIndex === tabs.length - 1 is a legal prop combination that leaves
  // nothing to walk to, so the scene would open and then sit still. Clamp it
  // back one tab so there is always at least one switch to watch.
  const firstTab = Math.min(Math.max(0, startIndex), Math.max(0, tabs.length - 2));
  const moves = Math.max(0, tabs.length - 1 - firstTab);
  let position = firstTab;
  for (let move = 0; move < moves; move += 1) {
    const from = firstSwitchAtSeconds + switchEverySeconds * move;
    position += ease(from, from + transitionSeconds, EASING.editorial);
  }

  const windowIn = spring({
    frame: frame - at(T.window),
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });
  const open = ease(T.window, T.window + T.windowFor, EASING.editorial);
  const chromeIn = ease(T.chrome, T.chrome + 0.4);
  const panelIn = ease(T.panel, T.panel + 0.44);

  // Exits accelerate away; entrances decelerate in. Never ease-out an exit.
  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const windowW = Math.min(width - safe.paddingLeft - safe.paddingRight, 880 * u);
  const barPad = 5 * u;
  const barW = windowW - 2 * 22 * u;
  const tabW = (barW - 2 * barPad) / Math.max(1, tabs.length);
  const panelH = 196 * u;

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
          borderRadius: 20 * u,
          background: palette.window,
          border: `1px solid ${palette.border}`,
          boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${26 * u}px ${
            64 * u
          }px ${palette.shadow}`,
          overflow: "hidden",
          clipPath: `inset(0 0 ${(1 - open) * 100}% 0 round ${20 * u}px)`,
          opacity: 1 - exit,
          translate: `0 ${(1 - windowIn) * 24 * u + exit * 32 * u}px`,
        }}
      >
        {windowTitle ? (
          <div
            style={{
              height: 42 * u,
              display: "flex",
              alignItems: "center",
              gap: 8 * u,
              padding: `0 ${18 * u}px`,
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
                fontSize: 14.5 * u,
                fontWeight: 500,
              }}
            >
              {windowTitle}
            </span>
          </div>
        ) : null}

        <div style={{ padding: `${18 * u}px ${22 * u}px ${22 * u}px` }}>
          {/* Segmented tab bar — the pill travels, the labels stay put. */}
          <div
            style={{
              position: "relative",
              display: "flex",
              padding: barPad,
              borderRadius: 12 * u,
              background: palette.band,
              border: `1px solid ${palette.border}`,
              opacity: chromeIn,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: barPad,
                left: barPad + position * tabW,
                width: tabW,
                height: 34 * u,
                borderRadius: 9 * u,
                background: `${accentColor}24`,
                border: `1px solid ${accentColor}70`,
              }}
            />
            {tabs.map((tab, index) => {
              // Labels light up in proportion to how close the pill is, so the
              // handover happens over the same frames as the travel.
              const near = Math.max(0, 1 - Math.abs(position - index));
              return (
                <div
                  key={tab.label}
                  style={{
                    position: "relative",
                    width: tabW,
                    height: 34 * u,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: near > 0.5 ? accentColor : palette.dim,
                    fontSize: 15 * u,
                    fontWeight: near > 0.5 ? 600 : 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "relative",
              marginTop: 16 * u,
              height: panelH,
              // Deliberately not clipped here. A clip on this box would sit
              // exactly on the text's own left edge, so the first pixel of
              // travel would slice the headline; the card clips instead, 22u
              // further out, and the fade is over before anything reaches it.
              opacity: panelIn,
            }}
          >
            {tabs.map((tab, index) => {
              const distance = position - index;
              // Faded out well before the travel could reach the clip edge.
              // A panel that is still 40% opaque when its first character hits
              // the container border reads as text sliced flat against the
              // panel, not as motion — the travel budget below is sized so a
              // panel is invisible by the time it has moved PANEL_TRAVEL_MAX.
              const visible = Math.max(0, 1 - Math.abs(distance) * 1.35);
              if (visible <= 0) return null;

              return (
                <div
                  key={tab.label}
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: visible,
                    // Depth carries the swap that the short travel cannot.
                    scale: `${1 - Math.abs(distance) * 0.035}`,
                  }}
                >
                  <div
                    style={{
                      translate: `${-distance * 18 * u}px`,
                    }}
                  >
                    <div
                      style={{
                        color: palette.fg,
                        fontSize: 32 * u,
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        lineHeight: 1.1,
                      }}
                    >
                      {tab.title}
                    </div>
                    {tab.summary ? (
                      <div
                        style={{
                          marginTop: 5 * u,
                          color: palette.dim,
                          fontSize: 16 * u,
                          fontWeight: 500,
                        }}
                      >
                        {tab.summary}
                      </div>
                    ) : null}
                  </div>

                  <div
                    style={{
                      marginTop: 16 * u,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {(tab.rows ?? []).map((row, rowIndex) => (
                      <div
                        key={row.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          height: 36 * u,
                          borderTop: `1px solid ${palette.border}`,
                          // Rows trail the headline by a little more each step
                          // down, so the panel arrives as one object with depth.
                          // The deepest row is the travel budget: 26u × the
                          // 0.74 distance at which a panel fades out is still
                          // inside the card's own 22u of bleed.
                          translate: `${
                            -distance * (18 + rowIndex * 4) * u
                          }px`,
                        }}
                      >
                        <span
                          style={{
                            color: palette.dim,
                            fontSize: 16 * u,
                            fontWeight: 500,
                          }}
                        >
                          {row.label}
                        </span>
                        <span
                          style={{
                            color: palette.fg,
                            fontSize: 17 * u,
                            fontWeight: 600,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
