import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});

export type EcosystemOrbitProps = {
  centerLabel?: string;
  satellites?: string[];
  accentColor?: string;
};

const COLORS = {
  bg: "#080810",
  center: "#e8b86d",
  satellite: "#2dd4bf",
  /** Opaque — the per-line `opacity` attribute carries the whole ramp. A
   *  pre-multiplied 0.35 alpha here made even the lit spoke invisible at tile
   *  size once it was multiplied again. */
  line: "#e8b86d",
} as const;

/**
 * Satellites fly *inward* from outside the orbit rather than outward from the
 * hub. Travelling outward puts every chip on top of the centre pill at low
 * spring progress — the hub is ~160px wide and a chip ~130px, so no inward
 * start radius short enough to read as "deploying" clears both half-widths.
 */
const ORBIT_START_FACTOR = 1.32;

/** One glyph per satellite so a chip still carries meaning at tile size. */
const SATELLITE_ICONS = [
  // terminal caret
  "M5 8l4 4-4 4M12 16h7",
  // film frame
  "M4 6h16v12H4zM9 6v12M15 6v12",
  // play
  "M9 6l10 6-10 6z",
  // book
  "M5 5h6a3 3 0 013 3v11a2 2 0 00-2-2H5zM19 5h-6",
  // grid
  "M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z",
] as const;

/**
 * One-shot ambient demo, not a seamless loop: the orbit's rotation period
 * (2π × 38 frames ≈ 239 frames) and the pulse period (2π × 14 ≈ 88 frames)
 * don't divide the composition's duration cleanly, and the satellites never
 * complete a full revolution within a typical preview length — so there is
 * no frame where the motion state repeats. Rather than force a seamless
 * wrap, the orbit settles to a stop and fades out as a deliberate exit beat.
 */
const EXIT_DURATION = 30;

export const EcosystemOrbit: React.FC<EcosystemOrbitProps> = ({
  centerLabel = "RemotionUI",
  satellites = ["CLI", "Scenes", "Reels", "Docs", "Registry"],
  accentColor = COLORS.center,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const cx = width / 2;
  /** Lifted off centre so the lowest chip clears the caption. */
  const cy = height * 0.45;
  /** Wide enough that a settled chip's inner edge clears the hub pill. */
  const radius = Math.min(width, height) * 0.33;
  const centerEnter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 100, mass: 0.9 },
    durationInFrames: 30,
  });

  /** Settle: freeze the orbit's motion clock before the fade begins so the
   *  satellites glide to a rest position instead of vanishing mid-spin. */
  const exitStart = durationInFrames - EXIT_DURATION;
  const settledFrame = Math.min(frame, exitStart);
  const pulse = (Math.sin(settledFrame / 14) + 1) / 2;
  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames - 1],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.exit },
  );

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        backgroundImage: `radial-gradient(circle at 50% 50%, ${accentColor}12, transparent 55%)`,
        fontFamily,
        opacity: 1 - exitProgress,
      }}
    >
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {satellites.map((label, i) => {
          const stagger = i * 5;
          const sp = spring({
            frame: frame - stagger,
            fps,
            config: { damping: 18, stiffness: 90, mass: 1 },
            durationInFrames: 45,
          });
          const angle =
            (i / satellites.length) * Math.PI * 2 + settledFrame / 38;
          const orbit = radius * (ORBIT_START_FACTOR - (ORBIT_START_FACTOR - 1) * sp);
          const x = cx + Math.cos(angle) * orbit;
          const y = cy + Math.sin(angle) * orbit;
          const activeIdx = Math.floor(settledFrame / 28) % satellites.length;
          const isActive = activeIdx === i;
          // Inactive spokes stay clearly drawn — at 0.15 opacity / 2px they
          // vanished at tile size and the graph read as floating chips.
          const lineOpacity = isActive
            ? interpolate(
                settledFrame % 28,
                [0, 6, 22, 28],
                [0.45, 0.95, 0.95, 0.45],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              )
            : 0.35;
          return (
            <line
              key={`line-${label}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={COLORS.line}
              strokeWidth={isActive ? 4 : 3}
              strokeLinecap="round"
              opacity={lineOpacity * sp}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          left: cx - scaleFont(108, width),
          top: cy - scaleFont(50, width),
          width: scaleFont(216, width),
          height: scaleFont(100, width),
          borderRadius: 999,
          /* Opaque under the tint — the spokes run to the centre, so a
           * translucent hub let them draw straight across the label. */
          background: `linear-gradient(${accentColor}26, ${accentColor}26), #0b0b14`,
          border: `${Math.max(1, scaleFont(2, width))}px solid ${accentColor}88`,
          display: "grid",
          placeItems: "center",
          color: "#f4f4f5",
          fontSize: scaleFont(34, width),
          fontWeight: 700,
          opacity: centerEnter,
          scale: `${0.88 + centerEnter * 0.12 + pulse * 0.03}`,
          boxShadow: `0 0 ${Math.round(40 + pulse * 24)}px ${accentColor}44`,
        }}
      >
        {centerLabel}
      </div>
      {satellites.map((label, i) => {
        const stagger = i * 5;
        const sp = spring({
          frame: frame - stagger,
          fps,
          config: { damping: 18, stiffness: 90, mass: 1 },
          durationInFrames: 45,
        });
        const angle =
          (i / satellites.length) * Math.PI * 2 + settledFrame / 38;
        const orbit = radius * (ORBIT_START_FACTOR - (ORBIT_START_FACTOR - 1) * sp);
        const chipWidth = scaleFont(140, width);
        const chipHeight = scaleFont(52, width);
        const x = cx + Math.cos(angle) * orbit - chipWidth / 2;
        const y = cy + Math.sin(angle) * orbit - chipHeight / 2;
        const activeIdx = Math.floor(settledFrame / 28) % satellites.length;
        const lift =
          activeIdx === i
            ? interpolate(
                settledFrame % 28,
                [0, 8, 20, 28],
                [1, 1.08, 1.08, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: EASING.enter,
                },
              )
            : 1;

        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: chipWidth,
              height: chipHeight,
              borderRadius: scaleFont(16, width),
              background:
                activeIdx === i
                  ? `${COLORS.satellite}2e`
                  : `${COLORS.satellite}18`,
              border: `${Math.max(1, scaleFont(2, width))}px solid ${COLORS.satellite}${activeIdx === i ? "aa" : "66"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: scaleFont(10, width),
              color: "#eef2f7",
              fontSize: scaleFont(24, width),
              fontWeight: 700,
              opacity: sp,
              scale: `${lift}`,
              boxShadow:
                activeIdx === i
                  ? `0 0 ${scaleFont(28, width)}px ${COLORS.satellite}55`
                  : undefined,
            }}
          >
            <svg
              width={scaleFont(24, width)}
              height={scaleFont(24, width)}
              viewBox="0 0 24 24"
              fill="none"
              style={{ flexShrink: 0 }}
            >
              <path
                d={SATELLITE_ICONS[i % SATELLITE_ICONS.length]}
                stroke={COLORS.satellite}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {label}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: safe.paddingLeft,
          right: safe.paddingRight,
          bottom: safe.paddingBottom,
          textAlign: "center",
          color: "#a1a1aa",
          fontSize: scaleFont(30, width),
          fontWeight: 600,
          opacity: interpolate(frame, [40, 55], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Integrations orbit your brand
      </div>
    </AbsoluteFill>
  );
};
