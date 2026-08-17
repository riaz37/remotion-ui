import { loadFont } from "@remotion/google-fonts/Inter";
import { Video } from "@remotion/media";
import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";
import {
  getMediaObjectFitStyle,
  isVideoSource,
  type MediaFit,
} from "@/remotion/lib/media-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type SplitScreenPanel = {
  src: string;
  /** Chip on the panel — "Before", "After", a version, a variant. */
  label?: string;
  fit?: MediaFit;
};

export type SplitScreenProps = {
  left: SplitScreenPanel;
  right: SplitScreenPanel;
  /** Headline above the comparison. */
  title?: string;
  /**
   * Seconds after which the divider travels to the left edge, wiping the left
   * panel away to leave the right one whole. Omit to hold the even split.
   */
  wipeAtSeconds?: number;
  /** Where the divider rests before any wipe, 0–1 across the frame. */
  split?: number;
  backgroundColor?: string;
  accentColor?: string;
  theme?: "dark" | "light";
  /**
   * Seconds after which the comparison leaves. Omit to hold — correct inside a
   * `TransitionSeries`, where the transition covers the tail, and wrong on its
   * own, where the scene stands still for the rest of the clip.
   */
  holdSeconds?: number;
  /** Animation speed multiplier. */
  speed?: number;
};

/** Beat plan in seconds. */
const T = {
  /** Panels arrive from opposite edges and meet at the divider. */
  panels: 0,
  panelsFor: 0.62,
  title: 0.3,
  labels: 0.52,
  wipeFor: 1.1,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const Panel: React.FC<{ panel: SplitScreenPanel }> = ({ panel }) => {
  const style = getMediaObjectFitStyle(panel.fit ?? "cover");
  return isVideoSource(panel.src) ? (
    // `pauseWhenBuffering` holds the Player on a slow source instead of showing
    // a stale frame under the divider. On `@remotion/media` it lives on the
    // fallback props, since that is the path that can stall; add `premountFor`
    // on the wrapping Sequence to have the streams ready before the scene runs.
    <Video
      src={panel.src}
      muted
      loop
      fallbackOffthreadVideoProps={{ pauseWhenBuffering: true }}
      style={style}
    />
  ) : (
    <Img src={panel.src} style={style} />
  );
};

/**
 * A comparison that is actually made: the two panels arrive from opposite edges
 * and meet at the divider, their labels land, and — if the scene has time for
 * it — the divider travels back to the left edge, wiping the first panel away
 * and leaving the second whole, which is the move a before/after is for.
 */
export const SplitScreen: React.FC<SplitScreenProps> = ({
  left,
  right,
  title,
  wipeAtSeconds,
  split = 0.5,
  backgroundColor,
  accentColor = "#E8B86D",
  theme = "dark",
  holdSeconds,
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

  const panelsIn = ease(T.panels, T.panels + T.panelsFor, EASING.editorial);
  const titleIn = title ? ease(T.title, T.title + 0.5) : 0;
  const labelsIn = ease(T.labels, T.labels + 0.45);
  const wipe =
    wipeAtSeconds === undefined
      ? 0
      : ease(wipeAtSeconds, wipeAtSeconds + T.wipeFor, EASING.editorial);

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

  /**
   * Divider position across the frame, 0–1. It travels to the left edge, so the
   * left panel is the one that shrinks and the right — which sits underneath —
   * is the one left whole. Travelling right instead expanded the left panel
   * over the right and ended the scene on the "before" under the "after" label.
   */
  const at01 = interpolate(wipe, [0, 1], [split, 0]);
  const dividerPx = at01 * width;
  /** The handle is a circle on the divider; keep it inside the frame at both ends. */
  const handlePx = Math.min(Math.max(dividerPx, 22 * u), width - 22 * u);

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
      {/* Everything the scene draws leaves together. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - exit,
          scale: 1 - exit * 0.04,
        }}
      >
        {/* Right panel underneath — the wipe uncovers it rather than moving it */}
        <div style={{ position: "absolute", inset: 0 }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              transform: `translateX(${(1 - panelsIn) * 12}%)`,
            }}
          >
            <Panel panel={right} />
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `inset(0 ${(1 - at01) * 100}% 0 0)`,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              transform: `translateX(${(1 - panelsIn) * -12}%)`,
            }}
          >
            <Panel panel={left} />
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: dividerPx - 1.5 * u,
            width: 3 * u,
            background: accentColor,
            boxShadow: `0 0 ${20 * u}px ${accentColor}88`,
            opacity: panelsIn,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: handlePx,
            width: 44 * u,
            height: 44 * u,
            marginLeft: -22 * u,
            marginTop: -22 * u,
            borderRadius: "50%",
            background: accentColor,
            display: "grid",
            placeItems: "center",
            boxShadow: `0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.45)`,
            opacity: panelsIn,
            scale: interpolate(panelsIn, [0, 1], [0.6, 1], {
              output: "perceptual-scale",
            }),
          }}
        >
          <svg width={22 * u} height={22 * u} viewBox="0 0 24 24" fill="none">
            <path
              d="M10 7 5.5 12 10 17M14 7l4.5 5-4.5 5"
              stroke={palette.page}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Scrim under the copy, so labels hold over any footage */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, ${palette.page}CC, transparent 34%, transparent 62%, ${palette.page}CC)`,
            pointerEvents: "none",
          }}
        />

        {title ? (
          <div
            style={{
              position: "absolute",
              left: safe.paddingLeft,
              right: safe.paddingRight,
              top: safe.paddingTop,
              textAlign: "center",
              color: "#F5F6F8",
              fontSize: 42 * u,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * 12 * u}px)`,
            }}
          >
            {title}
          </div>
        ) : null}

        {/* Labels ride at the top of the panels they name. At the bottom they sat
            exactly where footage carries its own lower third, and the chip
            covered the shot's headline. */}
        <div
          style={{
            position: "absolute",
            left: safe.paddingLeft,
            right: safe.paddingRight,
            top: safe.paddingTop + (title ? 62 * u : 0),
            display: "flex",
            justifyContent: "space-between",
            opacity: labelsIn,
          }}
        >
          {[left, right].map((panel, index) =>
            panel.label ? (
              <div
                key={`${panel.label}-${index}`}
                style={{
                  padding: `${9 * u}px ${18 * u}px`,
                  borderRadius: 999,
                  background: "rgba(8,8,11,0.66)",
                  border: `1px solid ${accentColor}66`,
                  color: "#F5F6F8",
                  fontSize: 22 * u,
                  fontWeight: 600,
                  // The left label leaves with the panel it names; the right one
                  // survives, because the surviving panel is the one it names.
                  opacity: index === 0 ? 1 - wipe : 1,
                  transform: `translateY(${(1 - labelsIn) * 12 * u}px)`,
                }}
              >
                {panel.label}
              </div>
            ) : (
              <span key={`spacer-${index}`} />
            ),
          )}
        </div>
      </div>
    </div>
  );
};
