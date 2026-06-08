import { AbsoluteFill } from "remotion";

export const WelcomeComposition: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, rgb(14, 18, 27), rgb(26, 40, 64))",
        color: "white",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: 96,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          maxWidth: 1100,
        }}
      >
        <div
          style={{
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          RemotionUI Starter
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          Your first composition is ready.
        </div>
        <div
          style={{
            fontSize: 34,
            lineHeight: 1.35,
            color: "rgba(255,255,255,0.78)",
            maxWidth: 900,
          }}
        >
          Add a full scene with <code>npx remotion-ui add intro</code> or build
          from primitives like <code>fade-in</code> and <code>slide-left</code>.
        </div>
      </div>
    </AbsoluteFill>
  );
};
