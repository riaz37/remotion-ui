import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafePadding } from "@/remotion/lib/layout";

export type TimelineStep = {
  title: string;
  description?: string;
};

export type TimelineStepsProps = {
  steps: TimelineStep[];
  title?: string;
  backgroundColor?: string;
  accentColor?: string;
};

export const TimelineSteps: React.FC<TimelineStepsProps> = ({
  steps,
  title = "How it works",
  backgroundColor = "#0f172a",
  accentColor = "#60a5fa",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const padding = getSafePadding({ width, height, ratio: 0.08 });

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor,
        color: "white",
        padding,
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 48,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: Math.round(width * 0.052),
          lineHeight: 1,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(steps.length, 4)}, 1fr)`,
          gap: 22,
        }}
      >
        {steps.slice(0, 4).map((step, index) => {
          const progress = interpolate(
            frame,
            [index * 10, index * 10 + 28],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          return (
            <div
              key={step.title}
              style={{
                opacity: progress,
                transform: `translateY(${(1 - progress) * 24}px)`,
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: accentColor,
                  color: "#020617",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 26,
                  fontWeight: 900,
                }}
              >
                {index + 1}
              </div>
              <div
                style={{
                  height: 3,
                  background:
                    index === steps.length - 1
                      ? "transparent"
                      : "rgba(96,165,250,0.45)",
                  margin: "22px 0",
                }}
              />
              <div style={{ fontSize: 30, fontWeight: 800 }}>{step.title}</div>
              {step.description ? (
                <div
                  style={{
                    color: "#cbd5e1",
                    fontSize: 24,
                    marginTop: 10,
                    lineHeight: 1.3,
                  }}
                >
                  {step.description}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
