import { measureText } from "@remotion/layout-utils";
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";

export type PerspectiveMarqueeProps = {
  text: string;
  /** Scroll speed in px per frame along the floor plane. */
  speed?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  fontFamily?: string;
  gap?: number;
  /** Floor plane tilt in degrees — higher values exaggerate depth. */
  floorTilt?: number;
  /** Perspective distance in px — lower values exaggerate depth. */
  perspective?: number;
  showFloorGrid?: boolean;
};

function getItemWidth(
  text: string,
  fontSize: number,
  fontWeight: number,
  fontFamily?: string,
) {
  const family = fontFamily ?? "system-ui";

  if (typeof document !== "undefined") {
    return measureText({
      text,
      fontFamily: family,
      fontSize,
      fontWeight: String(fontWeight),
    }).width;
  }

  return text.length * fontSize * 0.55;
}

export const PerspectiveMarquee: React.FC<PerspectiveMarqueeProps> = ({
  text,
  speed = 10,
  fontSize: fontSizeProp,
  color = "#f4f4f5",
  fontWeight = 600,
  fontFamily,
  gap = 72,
  floorTilt = 70,
  perspective = 640,
  showFloorGrid = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(56, width);
  const farFontSize = Math.round(fontSize * 0.58);
  const farGap = Math.round(gap * 1.1);
  const displayText = text.toUpperCase();

  const { repetitions, nearLoopWidth, loopPeriodFrames } = useMemo(() => {
    const nearItemWidth = getItemWidth(
      displayText,
      fontSize,
      fontWeight,
      fontFamily,
    );
    const count = Math.max(4, Math.ceil(width / nearItemWidth) + 2);
    const nearLoop =
      count * nearItemWidth + count * gap;

    return {
      repetitions: count,
      nearLoopWidth: nearLoop,
      loopPeriodFrames: Math.max(1, Math.round(nearLoop / speed)),
    };
  }, [displayText, fontFamily, fontSize, fontWeight, gap, speed, width]);

  const progress = (frame % loopPeriodFrames) / loopPeriodFrames;
  const scrollX = -progress * 50;

  const items = useMemo(
    () =>
      Array.from({ length: repetitions * 2 }, (_, i) => (
        <span key={i}>{text}</span>
      )),
    [repetitions, text],
  );

  const horizonTop = Math.round(height * 0.34);
  const planeHeight = Math.round(height * 0.9);
  const gridCellW = Math.round(width * 0.11);
  const gridCellH = Math.round(fontSize * 0.75);
  const nearTrackBottom = Math.round(planeHeight * 0.38);
  const farTrackBottom = Math.round(planeHeight * 0.56);

  const trackTypography = {
    fontWeight,
    color,
    whiteSpace: "nowrap" as const,
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    ...(fontFamily ? { fontFamily } : {}),
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        background: "#080810",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 90% 45% at 50% 0%, rgba(255,255,255,0.09) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: horizonTop,
          left: "5%",
          right: "5%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: Math.round(height * 0.74),
          perspective,
          perspectiveOrigin: `50% ${horizonTop}px`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            width: "280%",
            marginLeft: "-140%",
            height: planeHeight,
            transform: `rotateX(${floorTilt}deg)`,
            transformOrigin: "50% 100%",
            transformStyle: "preserve-3d",
          }}
        >
          {showFloorGrid ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: nearTrackBottom,
                translate: `${scrollX}% 0`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "-12%",
                  right: "-12%",
                  top: "-240%",
                  bottom: "-45%",
                  backgroundImage: `
                    linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
                    linear-gradient(to top, rgba(255,255,255,0.14) 1px, transparent 1px)
                  `,
                  backgroundSize: `${gridCellW}px ${gridCellH}px`,
                  maskImage:
                    "linear-gradient(to top, black 8%, rgba(0,0,0,0.5) 62%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to top, black 8%, rgba(0,0,0,0.5) 62%, transparent 100%)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ width: nearLoopWidth * 2, height: 1, opacity: 0 }} />
            </div>
          ) : null}

          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: farTrackBottom,
              opacity: 0.32,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                gap: farGap,
                paddingLeft: gap,
                translate: `${scrollX}% 0`,
                fontSize: farFontSize,
                ...trackTypography,
              }}
            >
              {items}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: nearTrackBottom,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                gap,
                paddingLeft: gap,
                translate: `${scrollX}% 0`,
                fontSize,
                ...trackTypography,
              }}
            >
              {items}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `linear-gradient(to bottom, rgba(8,8,16,0.92) 0%, transparent ${horizonTop + 52}px, transparent 85%, rgba(8,8,16,0.25) 100%)`,
        }}
      />
    </div>
  );
};
