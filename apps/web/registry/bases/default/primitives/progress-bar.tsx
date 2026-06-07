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
  color = "#3b82f6",
  trackColor = "#1e293b",
  height = 12,
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
              color: "#94a3b8",
              fontSize: scaleFont(32, width),
              fontFamily: "system-ui, sans-serif",
              marginBottom: 12,
              fontWeight: 500,
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
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              width: `${value * 100}%`,
              height: "100%",
              backgroundColor: color,
              borderRadius: height,
              boxShadow: `0 0 12px ${color}66`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
