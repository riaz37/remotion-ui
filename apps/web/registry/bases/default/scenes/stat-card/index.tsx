import { AbsoluteFill, useVideoConfig } from "remotion";
import { Counter } from "@/remotion/primitives/counter";
import { SpringIn } from "@/remotion/primitives/spring-in";
import { scaleFont } from "@/remotion/lib/layout";

export type StatCardProps = {
  value: number;
  label: string;
  suffix?: string;
  backgroundColor?: string;
  accentColor?: string;
};

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  suffix = "",
  backgroundColor = "#0f172a",
  accentColor = "#3b82f6",
}) => {
  const { width } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 280,
          height: 280,
          borderRadius: "50%",
          border: `2px solid ${accentColor}44`,
          opacity: 0.6,
        }}
      />
      <SpringIn durationInFrames={35}>
        <div style={{ textAlign: "center" }}>
          <Counter
            from={0}
            to={value}
            suffix={suffix}
            durationInFrames={48}
            style={{ fontSize: scaleFont(96, width), color: accentColor }}
          />
          <p
            style={{
              color: "#94a3b8",
              fontSize: scaleFont(32, width),
              fontFamily: "system-ui, sans-serif",
              marginTop: 16,
              marginBottom: 0,
              fontWeight: 500,
            }}
          >
            {label}
          </p>
        </div>
      </SpringIn>
    </AbsoluteFill>
  );
};
