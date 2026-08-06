import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { EASING_ENTER, EASING_EXIT } from "@/remotion/lib/timing";

const ITEMS = ["Components", "Compositions", "Render queue", "Docs"];

/** Exit beat: list leaves staggered, mirroring the enter order. */
const EXIT_START = 70;
const EXIT_STAGGER = 5;
const EXIT_DURATION = 24;

export const ToolMenuSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });

  // Column takes a deliberate share of frame width so the list reads at a
  // glance even at small preview-tile scale, instead of a narrow 260px rail.
  const listWidth = Math.min(width * 0.46, 640);

  return (
    <AbsoluteFill style={{ background: "#080810" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          height: "100%",
          padding: `${safe.paddingTop}px ${safe.paddingRight}px ${safe.paddingBottom}px ${safe.paddingLeft}px`,
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 16,
            width: listWidth,
          }}
        >
          {ITEMS.map((item, i) => {
            const enterDelay = i * 6;
            const slide = interpolate(frame, [enterDelay, enterDelay + 18], [-120, 0], {
              easing: EASING_ENTER,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const enterOpacity = interpolate(frame, [enterDelay, enterDelay + 12], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            const exitDelay = EXIT_START + i * EXIT_STAGGER;
            const exitProgress = interpolate(
              frame,
              [exitDelay, exitDelay + EXIT_DURATION],
              [0, 1],
              {
                easing: EASING_EXIT,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );

            return (
              <div
                key={item}
                style={{
                  padding: "22px 28px",
                  borderRadius: 16,
                  background: "rgba(12,16,24,0.94)",
                  border: "1px solid rgba(148,163,184,0.14)",
                  color: "#e2e8f0",
                  fontSize: scaleFont(34, width),
                  fontWeight: 600,
                  transform: `translateX(${slide + exitProgress * 140}px)`,
                  opacity: enterOpacity * (1 - exitProgress),
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
