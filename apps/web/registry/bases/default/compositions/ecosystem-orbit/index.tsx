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
  line: "rgba(232,184,109,0.35)",
} as const;

export const EcosystemOrbit: React.FC<EcosystemOrbitProps> = ({
  centerLabel = "RemotionUI",
  satellites = ["CLI", "Scenes", "Reels", "Docs", "Registry"],
  accentColor = COLORS.center,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.28;
  const centerEnter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 100, mass: 0.9 },
    durationInFrames: 30,
  });
  const pulse = (Math.sin(frame / 14) + 1) / 2;

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        backgroundImage: `radial-gradient(circle at 50% 50%, ${accentColor}12, transparent 55%)`,
        fontFamily,
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
          const angle = (i / satellites.length) * Math.PI * 2 + frame / 38;
          const x = cx + Math.cos(angle) * radius * sp;
          const y = cy + Math.sin(angle) * radius * sp;
          const activeIdx = Math.floor(frame / 28) % satellites.length;
          const lineOpacity =
            activeIdx === i
              ? interpolate(frame % 28, [0, 6, 22, 28], [0.2, 0.85, 0.85, 0.2], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 0.15;
          return (
            <line
              key={`line-${label}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={COLORS.line}
              strokeWidth={2}
              opacity={lineOpacity * sp}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          left: cx - scaleFont(90, width),
          top: cy - scaleFont(44, width),
          width: scaleFont(180, width),
          height: scaleFont(88, width),
          borderRadius: 999,
          background: `${accentColor}22`,
          border: `1px solid ${accentColor}66`,
          display: "grid",
          placeItems: "center",
          color: "#f4f4f5",
          fontSize: scaleFont(28, width),
          fontWeight: 700,
          opacity: centerEnter,
          transform: `scale(${0.88 + centerEnter * 0.12 + pulse * 0.03})`,
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
        const angle = (i / satellites.length) * Math.PI * 2 + frame / 38;
        const x = cx + Math.cos(angle) * radius * sp - scaleFont(48, width);
        const y = cy + Math.sin(angle) * radius * sp - scaleFont(20, width);
        const activeIdx = Math.floor(frame / 28) % satellites.length;
        const lift =
          activeIdx === i
            ? interpolate(frame % 28, [0, 8, 20, 28], [1, 1.08, 1.08, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: EASING.enter,
              })
            : 1;

        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: scaleFont(96, width),
              height: scaleFont(40, width),
              borderRadius: 12,
              background: `${COLORS.satellite}18`,
              border: `1px solid ${COLORS.satellite}55`,
              display: "grid",
              placeItems: "center",
              color: "#e2e8f0",
              fontSize: scaleFont(18, width),
              fontWeight: 600,
              opacity: sp,
              transform: `scale(${lift})`,
              boxShadow:
                activeIdx === i
                  ? `0 0 20px ${COLORS.satellite}44`
                  : undefined,
            }}
          >
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
          color: "#71717a",
          fontSize: scaleFont(22, width),
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
