import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { enterProgress } from "@/remotion/lib/timing";

export type ProgressBarProps = {
  progress?: number;
  durationInFrames?: number;
  delayInFrames?: number;
  color?: string;
  trackColor?: string;
  height?: number;
  label?: string;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress = 1,
  durationInFrames = 60,
  delayInFrames = 0,
  color = "#e8b86d",
  trackColor = "rgba(255, 255, 255, 0.08)",
  height = 10,
  label,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const eased = enterProgress(frame, delayInFrames, durationInFrames);
  const value = interpolate(eased, [0, 1], [0, progress]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 48,
      }}
    >
      <div style={{ width: "72%", maxWidth: 720 }}>
        {label ? (
          <p
            style={{
              color: "rgba(248, 250, 252, 0.55)",
              fontSize: scaleFont(32, width),
              marginBottom: 12,
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            {label}
          </p>
        ) : null}
        <div
          style={{
            width: "100%",
            height,
            backgroundColor: trackColor,
            borderRadius: height,
            overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.35)",
          }}
        >
          <div
            style={{
              width: `${value * 100}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`,
              borderRadius: height,
              boxShadow: `0 0 16px ${color}55`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
