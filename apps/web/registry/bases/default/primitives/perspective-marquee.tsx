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
  /**
   * Hairline width for the horizon and the floor grid, in px.
   *
   * A 1px rule is half a device pixel once the frame is rendered below 1× (the
   * still audit runs at 0.5, a contact-sheet tile at roughly 0.32) and Chromium
   * drops it outright. Raise it for anything that will be downscaled.
   */
  lineWidth?: number;
  /** Halo behind the near row, so the type survives a downscale. */
  nearGlow?: boolean;
  /**
   * Width of one rendered item in px, if you already know it.
   *
   * The loop period is derived from this. Measuring is unreliable on the server
   * and against a font that has not finished loading, so pass it when the exact
   * scroll speed matters or when `fontFamily` is a webfont.
   */
  measuredTextWidth?: number;
};

const LETTER_SPACING_EM = 0.05;

function getItemWidth(
  text: string,
  fontSize: number,
  fontWeight: number,
  fontFamily?: string,
) {
  const family = fontFamily ?? "system-ui";
  const tracking = text.length * fontSize * LETTER_SPACING_EM;

  if (typeof document !== "undefined") {
    // `letterSpacing` has to be handed over too: the track renders with it, and
    // measuring without it understates the item by a whole character's width,
    // which shows up as a scroll that is faster than the stated `speed`.
    return measureText({
      text,
      fontFamily: family,
      fontSize,
      fontWeight: String(fontWeight),
      letterSpacing: `${LETTER_SPACING_EM}em`,
    }).width;
  }

  return text.length * fontSize * 0.55 + tracking;
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
  lineWidth = 1,
  nearGlow = false,
  measuredTextWidth,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(56, width);
  const farFontSize = Math.round(fontSize * 0.58);
  const farGap = Math.round(gap * 1.1);
  const displayText = text.toUpperCase();

  const { repetitions, loopPeriodFrames } = useMemo(() => {
    const nearItemWidth =
      measuredTextWidth ??
      getItemWidth(displayText, fontSize, fontWeight, fontFamily);
    // The plane is 280% of the frame, so the track has to cover that much of it
    // or the far side of the floor runs out of type mid-scroll.
    const count = Math.max(6, Math.ceil((width * 2.8) / nearItemWidth) + 2);
    const nearLoop =
      count * nearItemWidth + count * gap;

    return {
      repetitions: count,
      loopPeriodFrames: Math.max(1, Math.round(nearLoop / speed)),
    };
  }, [
    displayText,
    fontFamily,
    fontSize,
    fontWeight,
    gap,
    measuredTextWidth,
    speed,
    width,
  ]);

  const progress = (frame % loopPeriodFrames) / loopPeriodFrames;
  /**
   * Both tracks hold `repetitions * 2` copies laid out with a uniform gap and a
   * leading pad equal to that gap, so the row is exactly two identical halves
   * and a −50% translate lands copy `n + repetitions` where copy `n` was. That
   * is what makes the wrap seamless — and why the far row's pad has to be its
   * own `farGap`, not the near row's `gap`.
   */
  const scrollX = -progress * 50;

  const items = useMemo(
    () =>
      Array.from({ length: repetitions * 2 }, (_, i) => (
        <span key={i}>{text}</span>
      )),
    [repetitions, text],
  );

  const horizonTop = Math.round(height * 0.26);
  const planeHeight = Math.round(height * 0.9);
  const gridCellW = Math.round(width * 0.11);
  const gridCellH = Math.round(fontSize * 0.75);
  /**
   * The grid cannot ride the tracks' −50% translate: a repeating background only
   * wraps cleanly on a whole number of cells, and the loop width is not a
   * multiple of one — every wrap jumped the floor sideways. It scrolls in px,
   * modulo the cell, which is seamless at any speed.
   */
  const gridShift = -((frame * speed) % Math.max(1, gridCellW));
  /**
   * Track positions on the floor plane, as a share of its height.
   *
   * The plane is taller than the frame and hangs below it, so a track placed
   * low on the plane lands under the frame edge once the tilt throws it
   * forward — the near row was being cut through its baseline. Both tracks sit
   * high enough on the plane that the near row clears the bottom edge whole.
   */
  const nearTrackBottom = Math.round(planeHeight * 0.52);
  const farTrackBottom = Math.round(planeHeight * 0.68);

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
          height: lineWidth,
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
          {/* The grid covers the whole plane. It used to hang off a wrapper whose
              only child was a 1px spacer, so its `top: -240% / bottom: -45%`
              resolved against a 1px containing block and the floor was a 4px
              sliver — `showFloorGrid` rendered nothing anyone could see. */}
          {showFloorGrid ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.22) ${lineWidth}px, transparent ${lineWidth}px),
                  linear-gradient(to top, rgba(255,255,255,0.15) ${lineWidth}px, transparent ${lineWidth}px)
                `,
                backgroundSize: `${gridCellW}px ${gridCellH}px`,
                backgroundPosition: `${gridShift}px 0`,
                maskImage:
                  "linear-gradient(to top, black 6%, rgba(0,0,0,0.45) 46%, transparent 78%)",
                WebkitMaskImage:
                  "linear-gradient(to top, black 6%, rgba(0,0,0,0.45) 46%, transparent 78%)",
                pointerEvents: "none",
              }}
            />
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
                paddingLeft: farGap,
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
                ...(nearGlow
                  ? {
                      textShadow: `0 0 ${Math.round(fontSize * 0.28)}px ${color}, 0 0 ${Math.round(fontSize * 0.9)}px rgba(255,255,255,0.32)`,
                    }
                  : {}),
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
