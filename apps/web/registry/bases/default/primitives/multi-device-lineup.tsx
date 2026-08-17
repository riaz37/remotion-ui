import type { ReactNode } from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";

export type LineupScreen = {
  /** What fills the device's screen. Rendered at the device's own viewport. */
  content?: ReactNode;
  /** Caption under the device. */
  label?: string;
};

export type MultiDeviceLineupProps = {
  /** Screen for each device, in lineup order: phone, tablet, laptop. */
  phone?: LineupScreen;
  tablet?: LineupScreen;
  laptop?: LineupScreen;
  /**
   * Rendered inside every device when that device has no `content` of its own —
   * one responsive design shown at three widths.
   */
  children?: ReactNode;
  /** Overall scale of the lineup. */
  scale?: number;
  /** Frame the first device arrives. */
  delayInFrames?: number;
  /** Frames between devices. */
  staggerInFrames?: number;
  /** Frame the lineup starts leaving. Omit to leave it on screen. */
  exitAtInFrames?: number;
  /** Frames the exit takes. */
  exitInFrames?: number;
  bezelColor?: string;
  screenColor?: string;
  labelColor?: string;
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Screen sizes in CSS pixels before `scale`. Ratios are the real hardware. */
const HARDWARE = {
  phone: { screenW: 148, screenH: 320, bezel: 8, radius: 26 },
  tablet: { screenW: 236, screenH: 316, bezel: 11, radius: 20 },
  laptop: { screenW: 396, screenH: 248, bezel: 9, radius: 12 },
} as const;

type DeviceKind = keyof typeof HARDWARE;

/**
 * One design at three widths, arriving in order.
 *
 * Devices land largest-last: the laptop is the widest object and the thing a
 * viewer ends up reading, so it arrives on top of a lineup that already exists
 * rather than being the thing everything else lands beside.
 *
 * Screens are real elements at each device's own pixel size, not one screenshot
 * scaled three ways — pass the same `children` and whatever you render lays
 * itself out per width, which is the point of showing three devices at all.
 */
export const MultiDeviceLineup: React.FC<MultiDeviceLineupProps> = ({
  phone,
  tablet,
  laptop,
  children,
  scale = 1,
  delayInFrames = 4,
  staggerInFrames = 9,
  exitAtInFrames,
  exitInFrames = 16,
  bezelColor = "#15171D",
  screenColor = "#0B0C11",
  labelColor = "#7A828F",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  // Phone, tablet, laptop — the order they arrive in, smallest first.
  const devices: { kind: DeviceKind; screen?: LineupScreen }[] = [
    { kind: "phone", screen: phone },
    { kind: "tablet", screen: tablet },
    { kind: "laptop", screen: laptop },
  ];

  const chrome = (kind: DeviceKind) => {
    const spec = HARDWARE[kind];
    return {
      ...spec,
      width: spec.screenW + spec.bezel * 2,
      height: spec.screenH + spec.bezel * 2,
    };
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 26 * scale,
        opacity: 1 - exit,
        translate: `0 ${exit * 26 * scale}px`,
      }}
    >
      {devices.map((device, index) => {
        const spec = chrome(device.kind);
        const start = delayInFrames + index * staggerInFrames;
        const rise = spring({
          frame: frame - start,
          fps,
          // Clamped: a bezel that pops past 1.0 is a device growing bigger than
          // its own hardware, which reads as a wobble rather than an arrival.
          config: {
            damping: 17,
            stiffness: 150,
            mass: 0.75,
            overshootClamping: true,
          },
        });
        const fade = interpolate(frame, [start, start + 10], [0, 1], {
          easing: EASING.enter,
          ...clamp,
        });
        const riseScale = interpolate(rise, [0, 1], [0.94, 1], {
          output: "perceptual-scale",
          ...clamp,
        });

        return (
          <div
            key={device.kind}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10 * scale,
              opacity: fade,
              translate: `0 ${(1 - rise) * 26 * scale}px`,
              scale: String(riseScale),
            }}
          >
            <div
              style={{
                position: "relative",
                width: spec.width * scale,
                height: spec.height * scale,
                borderRadius: spec.radius * scale,
                background: bezelColor,
                border: `${1 * scale}px solid rgba(255,255,255,0.10)`,
                boxShadow: `inset 0 ${1 * scale}px 0 rgba(255,255,255,0.10), 0 ${
                  18 * scale
                }px ${44 * scale}px rgba(0,0,0,0.55)`,
                padding: spec.bezel * scale,
              }}
            >
              <div
                style={{
                  width: spec.screenW * scale,
                  height: spec.screenH * scale,
                  borderRadius: Math.max(4, spec.radius - spec.bezel) * scale,
                  background: screenColor,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* The screen is its own element at the device's real pixel
                    size, so a responsive child lays itself out per width. */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {device.screen?.content ?? children}
                </div>
              </div>

              {device.kind === "phone" ? (
                <div
                  style={{
                    position: "absolute",
                    top: (spec.bezel + 5) * scale,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 44 * scale,
                    height: 9 * scale,
                    borderRadius: 999,
                    background: "#05060A",
                  }}
                />
              ) : null}

              {device.kind === "tablet" ? (
                <div
                  style={{
                    position: "absolute",
                    top: (spec.bezel / 2) * scale,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 4 * scale,
                    height: 4 * scale,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.28)",
                  }}
                />
              ) : null}
            </div>

            {device.kind === "laptop" ? (
              // Base and hinge, drawn as their own strip: a laptop read as a
              // slab with rounded corners is the giveaway that a mockup was
              // never looked at.
              <div
                style={{
                  width: (spec.width + 52) * scale,
                  height: 9 * scale,
                  marginTop: -8 * scale,
                  borderRadius: `0 0 ${7 * scale}px ${7 * scale}px`,
                  background: "linear-gradient(180deg, #23262E 0%, #14161B 100%)",
                  boxShadow: `0 ${8 * scale}px ${18 * scale}px rgba(0,0,0,0.5)`,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 74 * scale,
                    height: 3 * scale,
                    borderRadius: `0 0 ${3 * scale}px ${3 * scale}px`,
                    background: "rgba(0,0,0,0.55)",
                  }}
                />
              </div>
            ) : null}

            {device.screen?.label ? (
              <div
                style={{
                  color: labelColor,
                  fontSize: 12 * scale,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "ui-sans-serif, system-ui, sans-serif",
                }}
              >
                {device.screen.label}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
