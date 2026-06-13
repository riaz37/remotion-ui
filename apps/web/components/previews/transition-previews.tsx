"use client";

import { Easing, interpolate, useCurrentFrame } from "remotion";

type SceneProps = {
  label: string;
  kicker: string;
  color: string;
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);

function DemoScene({ label, kicker, color }: SceneProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at 22% 18%, rgba(255,255,255,0.16), transparent 28%), #09111f",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: 580,
          minHeight: 230,
          display: "grid",
          alignContent: "center",
          gap: 18,
          borderRadius: 28,
          padding: "42px 48px",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.16)",
          boxShadow: `0 30px 90px ${color}30`,
        }}
      >
        <div
          style={{
            color,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 0,
          }}
        >
          {kicker}
        </div>
        <div
          style={{
            fontSize: 70,
            lineHeight: 0.95,
            fontWeight: 900,
            letterSpacing: 0,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function TransitionShell({
  mode,
}: {
  mode: "fade" | "slide" | "wipe" | "clock" | "light";
}) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame % 90, [18, 46], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  const coverTranslate = {
    fade: "translate3d(0, 0, 0)",
    slide: `translate3d(${(1 - progress) * 100}%, 0, 0)`,
    wipe: "translate3d(0, 0, 0)",
    clock: "translate3d(0, 0, 0)",
    light: "translate3d(0, 0, 0)",
  }[mode];

  const clip =
    mode === "wipe"
      ? `inset(0 ${Math.round((1 - progress) * 100)}% 0 0)`
      : mode === "clock"
        ? `circle(${Math.round(progress * 78)}% at 50% 50%)`
        : undefined;

  const opacity = mode === "fade" ? progress : 1;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <DemoScene label="Scene A" kicker="Before" color="#38bdf8" />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity,
          transform: coverTranslate,
          clipPath: clip,
        }}
      >
        <DemoScene label="Scene B" kicker="After" color="#f59e0b" />
      </div>
      {mode === "light" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: interpolate(frame % 90, [12, 30, 58], [0, 0.9, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            background:
              "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.9) 42%, rgba(251,146,60,0.72) 48%, transparent 68%)",
            transform: `translateX(${interpolate(
              frame % 90,
              [12, 58],
              [-70, 70],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            )}%)`,
            mixBlendMode: "screen",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 38,
          bottom: 34,
          right: 38,
          height: 8,
          borderRadius: 999,
          background: "rgba(255,255,255,0.14)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.round(progress * 100)}%`,
            height: "100%",
            borderRadius: 999,
            background: "linear-gradient(90deg, #38bdf8, #f59e0b)",
          }}
        />
      </div>
    </div>
  );
}

export const TransitionFadePreview: React.FC = () => (
  <TransitionShell mode="fade" />
);
export const TransitionSlidePreview: React.FC = () => (
  <TransitionShell mode="slide" />
);
export const TransitionWipePreview: React.FC = () => (
  <TransitionShell mode="wipe" />
);
export const TransitionClockWipePreview: React.FC = () => (
  <TransitionShell mode="clock" />
);
export const TransitionLightLeakPreview: React.FC = () => (
  <TransitionShell mode="light" />
);
