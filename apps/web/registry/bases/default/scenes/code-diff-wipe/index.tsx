import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

export type CodeDiffWipeProps = {
  before: string;
  after: string;
  title?: string;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#080810",
  panel: "rgba(10,12,20,0.96)",
  border: "rgba(148,163,184,0.14)",
  accent: "#2dd4bf",
} as const;

export const CodeDiffWipe: React.FC<CodeDiffWipeProps> = ({
  before,
  after,
  title = "Diff",
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const wipe = interpolate(frame, [20, 70], [0, 100], {
    easing: EASING.enter,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor,
        padding: `${safe.paddingTop}px ${safe.paddingRight}px ${safe.paddingBottom}px ${safe.paddingLeft}px`,
        fontFamily,
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 920,
          borderRadius: 20,
          border: `1px solid ${COLORS.border}`,
          background: COLORS.panel,
          overflow: "hidden",
          boxShadow: `0 0 40px ${accentColor}22`,
        }}
      >
        <div style={{ padding: "14px 18px", color: "#e2e8f0", fontSize: scaleFont(22, width) }}>
          {title}
        </div>
        <div style={{ position: "relative", minHeight: 220 }}>
          <pre style={{ margin: 0, padding: 20, color: "#94a3b8", fontSize: scaleFont(18, width), fontFamily: mono }}>
            {before}
          </pre>
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `inset(0 ${100 - wipe}% 0 0)`,
              background: "rgba(8,8,16,0.92)",
            }}
          >
            <pre style={{ margin: 0, padding: 20, color: accentColor, fontSize: scaleFont(18, width), fontFamily: mono }}>
              {after}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
