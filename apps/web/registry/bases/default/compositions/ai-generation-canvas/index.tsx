import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

const DESIGN_WIDTH = 1280;

export type AiGenerationCanvasProps = {
  prompt?: string;
  accentColor?: string;
  cardCount?: number;
  speed?: number;
};

const MiniBarChart: React.FC<{ accentColor: string; scale: number }> = ({
  accentColor,
  scale,
}) => {
  const bars = [0.4, 0.7, 0.55, 0.85, 0.5, 0.95, 0.65];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 6 * scale,
        height: 60 * scale,
        marginTop: 12 * scale,
      }}
    >
      {bars.map((height, index) => (
        <div
          key={index}
          style={{
            flex: 1,
            height: `${height * 100}%`,
            background: accentColor,
            borderRadius: 3 * scale,
            opacity: 0.3 + height * 0.7,
          }}
        />
      ))}
    </div>
  );
};

const MiniRows: React.FC<{ scale: number }> = ({ scale }) => (
  <div
    style={{
      marginTop: 12 * scale,
      display: "flex",
      flexDirection: "column",
      gap: 6 * scale,
    }}
  >
    {[0.9, 0.7, 0.85, 0.6].map((width, index) => (
      <div
        key={index}
        style={{
          height: 8 * scale,
          width: `${width * 100}%`,
          background: "rgba(255,255,255,0.12)",
          borderRadius: 4 * scale,
        }}
      />
    ))}
  </div>
);

const StatBlock: React.FC<{
  accentColor: string;
  value: string;
  scale: number;
}> = ({ accentColor, value, scale }) => (
  <div style={{ marginTop: 8 * scale }}>
    <div
      style={{
        fontSize: 36 * scale,
        fontWeight: 700,
        color: "white",
        letterSpacing: "-0.03em",
        fontFamily,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: 12 * scale,
        color: accentColor,
        marginTop: 2 * scale,
        fontWeight: 500,
      }}
    >
      +12.4% this week
    </div>
  </div>
);

const CardContent: React.FC<{
  index: number;
  accentColor: string;
  scale: number;
}> = ({ index, accentColor, scale }) => {
  const titles = [
    "Revenue",
    "Active Users",
    "Sessions",
    "Conversion",
    "Retention",
    "Latency",
  ];
  const values = ["$48.2k", "12,840", "9.1k", "3.8%", "76%", "142ms"];
  const variant = index % 3;

  return (
    <div style={{ width: "100%", height: "100%", padding: 18 * scale }}>
      <div
        style={{
          fontSize: 12 * scale,
          color: "rgba(255,255,255,0.55)",
          fontWeight: 500,
          fontFamily,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        {titles[index % titles.length]}
      </div>
      {variant === 0 ? (
        <>
          <StatBlock
            accentColor={accentColor}
            value={values[index % values.length]}
            scale={scale}
          />
          <MiniBarChart accentColor={accentColor} scale={scale} />
        </>
      ) : variant === 1 ? (
        <>
          <StatBlock
            accentColor={accentColor}
            value={values[index % values.length]}
            scale={scale}
          />
          <MiniRows scale={scale} />
        </>
      ) : (
        <>
          <MiniBarChart accentColor={accentColor} scale={scale} />
          <MiniRows scale={scale} />
        </>
      )}
    </div>
  );
};

export const AiGenerationCanvas: React.FC<AiGenerationCanvasProps> = ({
  prompt = "Generate a dashboard",
  accentColor = "#7c3aed",
  cardCount = 4,
  speed = 1,
}) => {
  const frame = useCurrentFrame() * speed;
  const { fps, width } = useVideoConfig();
  const scale = width / DESIGN_WIDTH;

  const P1_END = 40;
  const P2_END = 70;
  const P3_END = 100;

  const charCount = Math.floor(
    interpolate(frame, [4, P1_END - 2], [0, prompt.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const typedText = prompt.substring(0, charCount);
  const cursorVisible = Math.floor(frame / 12) % 2 === 0;

  const transformProgress = spring({
    frame: frame - P1_END,
    fps,
    config: { mass: 1, damping: 16, stiffness: 110 },
    durationInFrames: 30,
  });

  const inputCenteredW = 640 * scale;
  const inputCenteredH = 80 * scale;
  const headerW = 1200 * scale;
  const headerH = 56 * scale;
  const inputW = interpolate(
    transformProgress,
    [0, 1],
    [inputCenteredW, headerW],
  );
  const inputH = interpolate(
    transformProgress,
    [0, 1],
    [inputCenteredH, headerH],
  );
  const inputTop = interpolate(transformProgress, [0, 1], [320 * scale, 40 * scale]);
  const inputRadius = interpolate(transformProgress, [0, 1], [16 * scale, 12 * scale]);
  const inputFontSize = interpolate(transformProgress, [0, 1], [24 * scale, 14 * scale]);

  const skeletonOpacity = interpolate(frame, [P2_END, P3_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const shimmerPos = ((frame * 1.5) % 200) - 50;
  const cards = Array.from({ length: cardCount });

  return (
    <AbsoluteFill
      style={{
        background: "#0a0a0a",
        overflow: "hidden",
        fontFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: `${40 * scale}px ${40 * scale}px`,
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      {frame > P2_END ? (
        <div
          style={{
            position: "absolute",
            top: 130 * scale,
            left: 40 * scale,
            right: 40 * scale,
            bottom: 40 * scale,
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(cardCount, 4)}, 1fr)`,
            gap: 20 * scale,
          }}
        >
          {cards.map((_, index) => {
            const cardStart = P3_END + index * 8;
            const flipProgress = spring({
              frame: frame - cardStart,
              fps,
              config: { mass: 0.9, damping: 14, stiffness: 100 },
              durationInFrames: 30,
            });
            const rotation = interpolate(flipProgress, [0, 1], [0, 180]);
            const showSkeleton = rotation < 90;

            return (
              <div
                key={index}
                style={{
                  position: "relative",
                  perspective: 1200 * scale,
                  opacity: skeletonOpacity,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    transform: `rotateY(${rotation}deg)`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "#141416",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 14 * scale,
                      backfaceVisibility: "hidden",
                      overflow: "hidden",
                      visibility: showSkeleton ? "visible" : "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: `linear-gradient(110deg, transparent 0%, transparent ${shimmerPos}%, ${accentColor}22 ${shimmerPos + 15}%, transparent ${shimmerPos + 30}%)`,
                      }}
                    />
                    <div style={{ padding: 18 * scale }}>
                      <div
                        style={{
                          width: "40%",
                          height: 10 * scale,
                          background: "rgba(255,255,255,0.08)",
                          borderRadius: 4 * scale,
                        }}
                      />
                      <div
                        style={{
                          width: "70%",
                          height: 28 * scale,
                          background: "rgba(255,255,255,0.08)",
                          borderRadius: 6 * scale,
                          marginTop: 14 * scale,
                        }}
                      />
                      <div
                        style={{
                          width: "100%",
                          height: 60 * scale,
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: 6 * scale,
                          marginTop: 16 * scale,
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "#141416",
                      border: `1px solid ${accentColor}33`,
                      borderRadius: 14 * scale,
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      overflow: "hidden",
                      boxShadow: `0 0 0 1px ${accentColor}22, 0 ${20 * scale}px ${40 * scale}px rgba(0,0,0,0.4)`,
                    }}
                  >
                    <CardContent
                      index={index}
                      accentColor={accentColor}
                      scale={scale}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: inputTop,
          width: inputW,
          height: inputH,
          marginLeft: -inputW / 2,
          background: "rgba(20,20,22,0.85)",
          border: `1px solid ${accentColor}55`,
          borderRadius: inputRadius,
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          padding: `0 ${20 * scale}px`,
          boxShadow:
            transformProgress < 0.5
              ? `0 0 0 ${6 * scale}px ${accentColor}11, 0 ${30 * scale}px ${80 * scale}px rgba(0,0,0,0.6)`
              : `0 ${8 * scale}px ${24 * scale}px rgba(0,0,0,0.4)`,
        }}
      >
        <div
          style={{
            width: 20 * scale,
            height: 20 * scale,
            marginRight: 12 * scale,
            color: accentColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={20 * scale}
            height={20 * scale}
            fill="currentColor"
          >
            <path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z" />
          </svg>
        </div>
        <div
          style={{
            color: "white",
            fontSize: inputFontSize,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {typedText}
          {frame < P1_END && cursorVisible ? (
            <span
              style={{
                display: "inline-block",
                width: 2 * scale,
                height: inputFontSize,
                background: accentColor,
                marginLeft: 2 * scale,
                verticalAlign: "middle",
              }}
            />
          ) : null}
        </div>
        {transformProgress > 0.6 ? (
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 8 * scale,
              alignItems: "center",
              opacity: (transformProgress - 0.6) / 0.4,
            }}
          >
            <div
              style={{
                width: 8 * scale,
                height: 8 * scale,
                borderRadius: 4 * scale,
                background: accentColor,
                boxShadow: `0 0 ${12 * scale}px ${accentColor}`,
              }}
            />
            <div
              style={{
                fontSize: 12 * scale,
                color: "rgba(255,255,255,0.6)",
                fontWeight: 500,
              }}
            >
              Generating
            </div>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
