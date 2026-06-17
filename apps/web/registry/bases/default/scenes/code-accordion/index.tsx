import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DELAY, DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

export type AccordionSection = {
  title: string;
  code: string;
};

export type CodeAccordionProps = {
  sections?: AccordionSection[];
  activeIndex?: number;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#080810",
  panel: "rgba(10,12,20,0.94)",
  border: "rgba(148,163,184,0.14)",
  title: "#f4f4f5",
  muted: "#94a3b8",
  code: "#e2e8f0",
  accent: "#e8b86d",
} as const;

const DEFAULT_SECTIONS: AccordionSection[] = [
  {
    title: "Install the scene",
    code: 'npx remotion-ui add code-accordion',
  },
  {
    title: "Import in your composition",
    code: 'import { CodeAccordion } from "@/remotion/scenes/code-accordion";',
  },
  {
    title: "Render with sections",
    code: '<CodeAccordion sections={sections} activeIndex={1} />',
  },
];

export const CodeAccordion: React.FC<CodeAccordionProps> = ({
  sections = DEFAULT_SECTIONS,
  activeIndex = 1,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const monoFamily = "ui-monospace, SFMono-Regular, Menlo, monospace";
  const panelEnter = interpolate(frame, [0, DURATION.fast], [0, 1], {
    easing: EASING.enter,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const clampedIndex = Math.min(
    Math.max(activeIndex, 0),
    Math.max(sections.length - 1, 0),
  );

  return (
    <div
      style={{
        width,
        height,
        paddingLeft: safe.paddingLeft,
        paddingRight: safe.paddingRight,
        paddingTop: safe.paddingTop,
        paddingBottom: safe.paddingBottom,
        background: `radial-gradient(circle at 82% 18%, ${accentColor}20, transparent 32%), ${backgroundColor}`,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 85% 30% at 50% 0%, ${accentColor}16, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          borderRadius: scaleFont(18, width),
          background: COLORS.panel,
          border: `1px solid ${COLORS.border}`,
          overflow: "hidden",
          opacity: panelEnter,
          transform: `translateY(${(1 - panelEnter) * scaleFont(18, width)}px)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 ${scaleFont(24, width)}px ${scaleFont(72, width)}px rgba(0,0,0,0.4)`,
        }}
      >
        {sections.map((section, index) => {
          const headerDelay = index * STAGGER.relaxed;
          const headerEnter = interpolate(
            frame,
            [headerDelay, headerDelay + DURATION.fast],
            [0, 1],
            {
              easing: EASING.enter,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          const isActive = index === clampedIndex;
          const expandStart =
            DELAY.medium + clampedIndex * STAGGER.relaxed + DURATION.fast;
          const expandProgress = isActive
            ? interpolate(frame, [expandStart, expandStart + DURATION.fast], [0, 1], {
                easing: EASING.enter,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 0;
          const codeLines = section.code.split("\n");
          const expandedHeight =
            scaleFont(28, width) * codeLines.length +
            scaleFont(36, width);

          return (
            <div
              key={section.title}
              style={{
                borderBottom:
                  index < sections.length - 1
                    ? `1px solid ${COLORS.border}`
                    : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: scaleFont(14, width),
                  padding: `${scaleFont(18, width)}px ${scaleFont(22, width)}px`,
                  opacity: headerEnter,
                  transform: `translateX(${(1 - headerEnter) * scaleFont(-16, width)}px)`,
                }}
              >
                <div
                  style={{
                    width: scaleFont(10, width),
                    height: scaleFont(10, width),
                    borderRadius: 2,
                    background: isActive ? accentColor : COLORS.muted,
                    transform: `rotate(${isActive ? 45 + expandProgress * 45 : 0}deg)`,
                    boxShadow: isActive
                      ? `0 0 ${scaleFont(12, width)}px ${accentColor}88`
                      : "none",
                  }}
                />
                <div
                  style={{
                    color: isActive ? COLORS.title : COLORS.muted,
                    fontSize: scaleFont(28, width),
                    fontWeight: 700,
                    lineHeight: 1.1,
                  }}
                >
                  {section.title}
                </div>
              </div>
              <div
                style={{
                  height: isActive ? expandedHeight * expandProgress : 0,
                  overflow: "hidden",
                  background: isActive ? `${accentColor}0c` : "transparent",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    padding: `${scaleFont(8, width)}px ${scaleFont(22, width)}px ${scaleFont(20, width)}px`,
                    fontFamily: monoFamily,
                    fontSize: scaleFont(22, width),
                    lineHeight: 1.45,
                    color: COLORS.code,
                  }}
                >
                  {codeLines.map((line, lineIndex) => {
                    const lineDelay = expandStart + lineIndex * STAGGER.tight;
                    const lineVisible = interpolate(
                      frame,
                      [lineDelay, lineDelay + DURATION.fast],
                      [0, 1],
                      {
                        easing: EASING.enter,
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      },
                    );

                    return (
                      <div
                        key={`${line}-${lineIndex}`}
                        style={{
                          opacity: lineVisible,
                          transform: `translateY(${(1 - lineVisible) * scaleFont(8, width)}px)`,
                        }}
                      >
                        {line}
                      </div>
                    );
                  })}
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
