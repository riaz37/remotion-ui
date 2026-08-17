import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { scaleFont } from "@/remotion/lib/layout";
import { DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";
import { TerminalSimulator } from "@/remotion/scenes/terminal-simulator";
import { DeviceMockupZoom } from "@/remotion/scenes/device-mockup-zoom";

/**
 * 102 + 78 − 12 = 168.
 *
 * The old 90/90 split put the cut at frame 78, which landed the halfway sample
 * inside the crossfade — a dark, unreadable plate. The terminal now runs its
 * log out to roughly frame 88 and the device carries the last 78 frames alone.
 */
const SCENE_DURATIONS = {
  terminal: 102,
  device: 78,
} as const;

const FADE = transitionFade({ durationInFrames: DURATION.fast });

const DEPLOY_URL = "remotion-ui.vercel.app";

const SCREEN = {
  paper: "#FBF7F0",
  ink: "#111827",
  muted: "#6B7280",
  line: "rgba(17, 24, 39, 0.12)",
  ok: "#0E9F6E",
  accent: "#E8B86D",
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * The payoff screen, written for this composition.
 *
 * `DeviceMockupZoom` falls back to a generic campaign dashboard when it is
 * given no children, which made three different compositions end on a
 * byte-identical frame. A deploy video ends on the deployment.
 */
const DeployConsole: React.FC<{ url: string }> = ({ url }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const ease = (from: number, to: number) =>
    interpolate(frame, [from, to], [0, 1], { easing: EASING.enter, ...clamp });

  const check = ease(6, 30);
  const heading = ease(12, 36);
  const address = ease(20, 46);
  const ring = 64;

  const stats: Array<[string, string]> = [
    ["Build", "4.2s"],
    ["Region", "iad1"],
    ["Commit", "a41f9c2"],
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: SCREEN.paper,
        color: SCREEN.ink,
        display: "flex",
        flexDirection: "column",
        padding: `${scaleFont(26, width)}px ${scaleFont(34, width)}px`,
        gap: scaleFont(18, width),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: scaleFont(22, width),
          fontWeight: 700,
          color: SCREEN.muted,
        }}
      >
        <span
          style={{ display: "flex", alignItems: "center", gap: scaleFont(10, width) }}
        >
          <span
            style={{
              width: scaleFont(14, width),
              height: scaleFont(14, width),
              borderRadius: 999,
              background: SCREEN.ok,
              opacity: check,
            }}
          />
          Production
        </span>
        <span>remotion-ui</span>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: scaleFont(16, width),
          textAlign: "center",
        }}
      >
        <svg
          width={scaleFont(78, width)}
          height={scaleFont(78, width)}
          viewBox="0 0 72 72"
          fill="none"
        >
          <circle
            cx={36}
            cy={36}
            r={31}
            stroke={SCREEN.ok}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 31}
            strokeDashoffset={2 * Math.PI * 31 * (1 - check)}
            // Start the ring at twelve o'clock rather than three.
            style={{ rotate: "-90deg", transformOrigin: "36px 36px" }}
          />
          <path
            d="M22 37.5l9.5 9.5L51 26"
            stroke={SCREEN.ok}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={ring}
            strokeDashoffset={ring * (1 - ease(18, 40))}
          />
        </svg>

        <div
          style={{
            fontSize: scaleFont(58, width),
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            opacity: heading,
            translate: `0px ${(1 - heading) * scaleFont(14, width)}px`,
          }}
        >
          Deployed
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: scaleFont(12, width),
            padding: `${scaleFont(12, width)}px ${scaleFont(22, width)}px`,
            borderRadius: 999,
            background: "#ffffff",
            border: `1px solid ${SCREEN.line}`,
            fontSize: scaleFont(28, width),
            fontWeight: 700,
            opacity: address,
            translate: `0px ${(1 - address) * scaleFont(12, width)}px`,
          }}
        >
          <span
            style={{
              width: scaleFont(12, width),
              height: scaleFont(12, width),
              borderRadius: 999,
              background: SCREEN.accent,
            }}
          />
          {url}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: scaleFont(14, width),
        }}
      >
        {stats.map(([label, value], index) => {
          const enter = ease(28 + index * STAGGER.normal, 52 + index * STAGGER.normal);
          return (
            <div
              key={label}
              style={{
                borderRadius: scaleFont(16, width),
                padding: `${scaleFont(14, width)}px ${scaleFont(18, width)}px`,
                background: "#ffffff",
                border: `1px solid ${SCREEN.line}`,
                opacity: enter,
                translate: `0px ${(1 - enter) * scaleFont(12, width)}px`,
              }}
            >
              <div
                style={{
                  fontSize: scaleFont(20, width),
                  fontWeight: 700,
                  color: SCREEN.muted,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  marginTop: scaleFont(6, width),
                  fontSize: scaleFont(30, width),
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DeployReveal: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#080810" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.terminal}>
          {/* `zoom` lifts the 21px log type to roughly 18px on a 960-wide
              preview, which is what keeps the command readable on a tile. */}
          <TerminalSimulator
            title="Deploy"
            command="vercel deploy --prod"
            steps={[
              { text: "uploading build output", duration: "1.2s" },
              { text: "assigning production domain", duration: "340ms" },
            ]}
            summary={`live at ${DEPLOY_URL} in 4.2s`}
            speed={1.15}
            zoom={1.14}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.device}>
          <DeviceMockupZoom device="laptop">
            <DeployConsole url={DEPLOY_URL} />
          </DeviceMockupZoom>
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
