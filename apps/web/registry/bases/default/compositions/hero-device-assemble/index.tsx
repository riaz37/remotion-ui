import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { MultiDeviceLineup } from "@/remotion/primitives/multi-device-lineup";
import { scaleFont } from "@/remotion/lib/layout";
import { DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";
import { DeviceMockupZoom } from "@/remotion/scenes/device-mockup-zoom";
import { TitleCard } from "@/remotion/scenes/title-card";

/**
 * Duration math: 60 + 88 + 56 − 2 × 12 (fade) = 180.
 * Mirrored in `lib/preview-config.ts` and in `registry.json`.
 */
const SCENE_DURATIONS = {
  title: 60,
  device: 88,
  lineup: 56,
} as const;

const FADE = transitionFade({ durationInFrames: DURATION.fast });

const COLORS = {
  bg: "#080810",
  screen: "#f6f1e8",
  ink: "#111827",
  muted: "#6b7280",
  line: "rgba(17,24,39,0.12)",
  accent: "#e8b86d",
  teal: "#2dd4bf",
  rose: "#f472b6",
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** The phone screen springs in beside the laptop at this local frame. */
const PHONE_DELAY = 26;

/**
 * The laptop's own screen. `DeviceMockupZoom`'s default screen is the shared
 * `BrowserDashboard`, which made this composition's payoff frame byte-identical
 * to `deploy-reveal`'s — so this passes its own, built from few large shapes so
 * it still reads at a 308px tile instead of turning into a grey rectangle.
 */
const RegistryScreen: React.FC<{ width: number }> = ({ width }) => {
  const frame = useCurrentFrame();
  const tiles = [
    ["Hooks", COLORS.accent],
    ["Charts", COLORS.teal],
    ["Captions", COLORS.rose],
    ["Devices", COLORS.teal],
    ["Outros", COLORS.accent],
    ["Wipes", COLORS.rose],
  ] as const;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: COLORS.screen,
        color: COLORS.ink,
        padding: `${scaleFont(26, width)}px ${scaleFont(30, width)}px`,
        display: "flex",
        flexDirection: "column",
        gap: scaleFont(20, width),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: scaleFont(16, width),
        }}
      >
        <div>
          <div
            style={{
              color: COLORS.muted,
              fontSize: scaleFont(22, width),
              fontWeight: 700,
            }}
          >
            Desktop layout
          </div>
          <div
            style={{
              fontSize: scaleFont(54, width),
              lineHeight: 1,
              fontWeight: 800,
            }}
          >
            Registry
          </div>
        </div>
        <div
          style={{
            borderRadius: 999,
            padding: `${scaleFont(9, width)}px ${scaleFont(18, width)}px`,
            background: COLORS.ink,
            color: COLORS.screen,
            fontSize: scaleFont(24, width),
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          200 parts
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(2, 1fr)",
          gap: scaleFont(16, width),
        }}
      >
        {tiles.map(([label, color], index) => {
          const tileIn = interpolate(
            frame,
            [18 + index * STAGGER.tight, 40 + index * STAGGER.tight],
            [0, 1],
            { easing: EASING.enter, ...clamp },
          );
          return (
            <div
              key={label}
              style={{
                borderRadius: scaleFont(18, width),
                border: `1px solid ${COLORS.line}`,
                background: "#ffffff",
                padding: scaleFont(14, width),
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                opacity: tileIn,
                scale: `${0.9 + tileIn * 0.1}`,
              }}
            >
              <div
                style={{
                  width: "46%",
                  height: scaleFont(12, width),
                  borderRadius: 999,
                  background: color,
                }}
              />
              <div
                style={{
                  fontSize: scaleFont(26, width),
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** The phone's screen — a vertical reel queue, deliberately not the laptop's. */
const ReelScreen: React.FC<{ width: number }> = ({ width }) => {
  const frame = useCurrentFrame();
  const rows = ["Hook", "Proof", "CTA"] as const;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#fff8ed",
        color: COLORS.ink,
        padding: `${scaleFont(30, width)}px ${scaleFont(18, width)}px ${scaleFont(20, width)}px`,
        display: "flex",
        flexDirection: "column",
        gap: scaleFont(14, width),
      }}
    >
      <div
        style={{
          fontSize: scaleFont(44, width),
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        9:16
      </div>
      {rows.map((row, index) => {
        const rowIn = interpolate(
          frame,
          [
            PHONE_DELAY + 8 + index * STAGGER.tight,
            PHONE_DELAY + 28 + index * STAGGER.tight,
          ],
          [0, 1],
          { easing: EASING.enter, ...clamp },
        );
        return (
          <div
            key={row}
            style={{
              flex: 1,
              borderRadius: scaleFont(16, width),
              background: index === 0 ? COLORS.ink : "#ffffff",
              color: index === 0 ? COLORS.screen : COLORS.ink,
              border: `1px solid ${COLORS.line}`,
              display: "grid",
              placeItems: "center",
              fontSize: scaleFont(30, width),
              fontWeight: 800,
              opacity: rowIn,
              translate: `0px ${(1 - rowIn) * scaleFont(12, width)}px`,
            }}
          >
            {row}
          </div>
        );
      })}
    </div>
  );
};

/**
 * The assemble beat: the laptop lands first, then a phone springs in beside it
 * so the "every screen / device layers" promise in the title is actually kept.
 */
const DeviceAssembleBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const phone = spring({
    frame: frame - PHONE_DELAY,
    fps,
    config: { damping: 15, stiffness: 130, mass: 0.8 },
    durationInFrames: 34,
  });

  return (
    <AbsoluteFill>
      <DeviceMockupZoom device="laptop" accentColor={COLORS.accent}>
        <RegistryScreen width={width} />
      </DeviceMockupZoom>
      {/* `DeviceMockupZoom` puts its stage on `zIndex: 1`, so the phone has to
          be lifted above it — otherwise it assembles *behind* the laptop and
          reads as a cropped rectangle. */}
      <AbsoluteFill style={{ pointerEvents: "none", zIndex: 2 }}>
        <div
          style={{
            position: "absolute",
            right: scaleFont(96, width),
            bottom: scaleFont(24, height),
            width: width * 0.125,
            aspectRatio: "0.4615",
            borderRadius: scaleFont(30, width),
            background: "linear-gradient(145deg, #242a3a, #171b26)",
            padding: scaleFont(6, width),
            boxShadow: `0 ${scaleFont(26, width)}px ${scaleFont(56, width)}px rgba(0,0,0,0.5), 0 0 ${scaleFont(60, width) * phone}px ${COLORS.accent}33, inset 0 0 0 1px rgba(255,255,255,0.1)`,
            opacity: phone,
            scale: `${0.86 + phone * 0.14}`,
            translate: `${(1 - phone) * scaleFont(90, width)}px ${(1 - phone) * scaleFont(40, height)}px`,
            rotate: `${(1 - phone) * 7}deg`,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: scaleFont(24, width),
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <ReelScreen width={width} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * The one layout every device shows. Shapes rather than type: the primitive's
 * phone screen is 148px wide, so any text placed in it lands under 3px at a
 * 308px tile. Sizes are percentages so the same element lays itself out at all
 * three widths, which is the point of showing three devices.
 */
const ResponsiveScreen: React.FC = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      background: "#12151f",
      padding: "9%",
      display: "flex",
      flexDirection: "column",
      gap: "7%",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "6%" }}>
      <div
        style={{
          width: "34%",
          height: 6,
          borderRadius: 999,
          background: COLORS.accent,
        }}
      />
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 999,
          background: "rgba(255,255,255,0.14)",
        }}
      />
    </div>
    <div
      style={{
        flex: 1,
        borderRadius: 8,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        gap: "8%",
        padding: "8%",
      }}
    >
      {[0.62, 0.86, 0.44, 1].map((share, index) => (
        <div
          key={share}
          style={{
            width: `${share * 100}%`,
            height: 8,
            borderRadius: 999,
            background:
              index === 3
                ? COLORS.teal
                : index === 1
                  ? COLORS.accent
                  : "rgba(255,255,255,0.2)",
          }}
        />
      ))}
    </div>
    <div
      style={{
        height: "16%",
        borderRadius: 8,
        background: COLORS.accent,
        opacity: 0.9,
      }}
    />
  </div>
);

/**
 * Closing beat. Without it the 50% and 90% samples both landed inside the
 * device scene in the same pose, so the clip read as a single held frame.
 */
const ScreenLineup: React.FC<{ productName: string; tagline: string }> = ({
  productName,
  tagline,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const copyIn = interpolate(frame, [26, 48], [0, 1], {
    easing: EASING.enter,
    ...clamp,
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 38%, ${COLORS.accent}22 0, transparent 46%), linear-gradient(135deg, #080810 0%, #10131d 54%, #07070d 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: scaleFont(44, width),
        color: "#f8fafc",
      }}
    >
      <MultiDeviceLineup
        scale={(width / 960) * 0.7}
        delayInFrames={2}
        staggerInFrames={7}
      >
        <ResponsiveScreen />
      </MultiDeviceLineup>

      <div
        style={{
          textAlign: "center",
          opacity: copyIn,
          translate: `0px ${(1 - copyIn) * scaleFont(16, width)}px`,
        }}
      >
        <div
          style={{
            fontSize: scaleFont(64, width),
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {productName}
        </div>
        <div
          style={{
            marginTop: scaleFont(14, width),
            color: "#a1a1aa",
            fontSize: scaleFont(30, width),
            fontWeight: 600,
          }}
        >
          {tagline}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export type HeroDeviceAssembleProps = {
  title?: string;
  subtitle?: string;
  /** Name on the closing beat. */
  productName?: string;
  /** Line under the product name. */
  tagline?: string;
};

export const HeroDeviceAssemble: React.FC<HeroDeviceAssembleProps> = ({
  title = "Ship on every screen",
  subtitle = "Device layers spring into frame",
  productName = "RemotionUI",
  tagline = "One composition, every aspect ratio",
}) => {
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.title}>
          <TitleCard title={title} subtitle={subtitle} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.device}>
          <DeviceAssembleBeat />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.lineup}>
          <ScreenLineup productName={productName} tagline={tagline} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
