import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafePadding } from "@/remotion/lib/layout";

export type BRollItem = {
  src: string;
  title?: string;
};

export type BRollStackProps = {
  items: BRollItem[];
  title?: string;
  backgroundColor?: string;
  accentColor?: string;
};

export const BRollStack: React.FC<BRollStackProps> = ({
  items,
  title = "Build the story",
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
        display: "grid",
        gridTemplateColumns: "0.9fr 1.2fr",
        gap: 48,
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ color: accentColor, fontSize: 30, fontWeight: 800 }}>
          B-roll
        </div>
        <h2
          style={{
            fontSize: Math.round(width * 0.055),
            lineHeight: 1,
            margin: "10px 0 0",
          }}
        >
          {title}
        </h2>
      </div>
      <div style={{ position: "relative", height: Math.round(height * 0.62) }}>
        {items.slice(0, 4).map((item, index) => {
          const progress = interpolate(
            frame,
            [index * 12, index * 12 + 24],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          const rotate = [-7, 5, -3, 8][index] ?? 0;
          return (
            <div
              key={`${item.src}-${index}`}
              style={{
                position: "absolute",
                inset: `${index * 7}% ${Math.max(0, 18 - index * 5)}% ${Math.max(0, 18 - index * 5)}% ${index * 8}%`,
                borderRadius: 24,
                overflow: "hidden",
                border: "3px solid rgba(248,250,252,0.12)",
                background: "#020617",
                boxShadow: "0 28px 80px rgba(0,0,0,0.32)",
                opacity: progress,
                transform: `translateY(${(1 - progress) * 46}px) rotate(${rotate * progress}deg)`,
              }}
            >
              <Img
                src={item.src}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {item.title ? (
                <div
                  style={{
                    position: "absolute",
                    left: 18,
                    right: 18,
                    top: 18,
                    color: "white",
                    fontSize: 26,
                    fontWeight: 700,
                    textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                  }}
                >
                  {item.title}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
