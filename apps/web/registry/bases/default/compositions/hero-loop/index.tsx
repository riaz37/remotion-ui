import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BlurIn } from "@/remotion/primitives/blur-in";
import { Counter } from "@/remotion/primitives/counter";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { FadeOut } from "@/remotion/primitives/fade-out";
import { RotateIn } from "@/remotion/primitives/rotate-in";
import { ScaleIn } from "@/remotion/primitives/scale-in";
import { SlideUp } from "@/remotion/primitives/slide-up";
import { SpringIn } from "@/remotion/primitives/spring-in";
import { StaggerChildren } from "@/remotion/primitives/stagger-children";
import { Typewriter } from "@/remotion/primitives/typewriter";
import { WordHighlight } from "@/remotion/primitives/word-highlight";

const COLORS = {
  bg: "#080808",
  stage: "#0d0d0d",
  surface: "#111111",
  card: "#0f0f0f",
  border: "#1a1a1a",
  borderDim: "#1f1f1f",
  text: "#ffffff",
  secondary: "#999999",
  muted: "#555555",
  dim: "#333333",
  accent: "#6366f1",
  accentLight: "#a5b4fc",
  green: "#4ade80",
  yellow: "#fcd34d",
  pink: "#f9a8d4",
  cyan: "#67e8f9",
  purpleCode: "#c084fc",
} as const;

const font = {
  sans: "Inter, ui-sans-serif, system-ui, sans-serif",
  mono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
};

const cliLines = [
  { text: "$ npx remotion-ui@latest add counter", color: "#666666" },
  { text: "✓ Fetching registry...", color: COLORS.green, pulse: true },
  { text: "✓ Resolving dependencies...", color: COLORS.green, pulse: true },
  {
    text: "✓ src/remotion/primitives/counter.tsx",
    color: COLORS.green,
    pulse: true,
  },
  { text: "ready to import", color: COLORS.accentLight },
];

const pillItems = [
  ["FadeIn", COLORS.accentLight],
  ["SlideUp", "#86efac"],
  ["Typewriter", COLORS.yellow],
  ["Counter", COLORS.pink],
  ["BlurIn", COLORS.cyan],
  ["SpringIn", "#c4b5fd"],
] as const;

const valueRows = [
  ["No runtime dependency", COLORS.green],
  ["Source you own and edit", COLORS.accentLight],
  ["shadcn/ui workflow for video", COLORS.yellow],
] as const;

export const HeroLoop: React.FC = () => {
  const frame = useCurrentFrame();
  const finalFade = interpolate(frame, [444, 450], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.linear),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        color: COLORS.text,
        fontFamily: font.sans,
        opacity: finalFade,
        overflow: "hidden",
      }}
    >
      <BackgroundTexture />
      <SplitLayout>
        <LeftColumn>
          <SceneOneLeft />
          <Sequence from={90} durationInFrames={154} layout="none">
            <SceneTwoLeft />
          </Sequence>
          <Sequence from={240} durationInFrames={120} layout="none">
            <SceneThreeLeft />
          </Sequence>
        </LeftColumn>
        <RightColumn>
          <SceneOneRight />
          <Sequence from={88} durationInFrames={158} layout="none">
            <SceneTwoRight />
          </Sequence>
          <Sequence from={240} durationInFrames={122} layout="none">
            <SceneThreeRight />
          </Sequence>
        </RightColumn>
      </SplitLayout>
      <Sequence from={360} durationInFrames={90}>
        <SceneFour />
      </Sequence>
    </AbsoluteFill>
  );
};

const SplitLayout: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "grid",
      gridTemplateColumns: "50% 50%",
    }}
  >
    {children}
  </div>
);

const LeftColumn: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "relative",
      minWidth: 0,
    }}
  >
    {children}
  </div>
);

const RightColumn: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "relative",
      overflow: "hidden",
      minWidth: 0,
      backgroundColor: COLORS.stage,
      borderLeft: `1px solid ${COLORS.border}`,
    }}
  >
    {children}
  </div>
);

const SceneOneLeft: React.FC = () => (
  <LeftSceneSlot>
    <FadeOut delayInFrames={94} durationInFrames={12}>
      <div style={{ maxWidth: 590 }}>
        <BlurIn delayInFrames={20} durationInFrames={25} maxBlur={12}>
          <p style={eyebrowStyle}>RemotionUI</p>
        </BlurIn>
        <SlideUp delayInFrames={40} durationInFrames={30} distance={44}>
          <h1
            style={{
              margin: 0,
              fontSize: 66,
              lineHeight: 1.05,
              fontWeight: 900,
              letterSpacing: -1.2,
            }}
          >
            Copy-paste motion components for Remotion.
          </h1>
        </SlideUp>
        <FadeIn delayInFrames={75} durationInFrames={20}>
          <p style={{ margin: "28px 0 0", color: "#777777", fontSize: 26 }}>
            Install as source. Own every line.
          </p>
        </FadeIn>
      </div>
    </FadeOut>
  </LeftSceneSlot>
);

const SceneOneRight: React.FC = () => (
  <RightSceneSlot>
    <FadeOut delayInFrames={88} durationInFrames={12}>
      <SpringIn durationInFrames={34}>
        <TerminalCard />
      </SpringIn>
    </FadeOut>
  </RightSceneSlot>
);

const TerminalCard: React.FC = () => (
  <div style={terminalCardStyle}>
    <WindowChrome />
    <div style={{ display: "grid", gap: 12 }}>
      {cliLines.map((line, index) => (
        <TerminalLine key={line.text} {...line} delay={8 + index * 18} />
      ))}
    </div>
  </div>
);

const TerminalLine: React.FC<{
  text: string;
  color: string;
  delay: number;
  pulse?: boolean;
}> = ({ text, color, delay, pulse }) => {
  const frame = useCurrentFrame();
  const pulseOpacity = pulse
    ? interpolate(frame, [delay, delay + 20], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <div
      style={{
        position: "relative",
        minHeight: 24,
        paddingLeft: pulse ? 12 : 0,
        color,
        fontSize: 18,
        lineHeight: "24px",
      }}
    >
      {pulse ? (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 2,
            bottom: 2,
            width: 2,
            borderRadius: 2,
            backgroundColor: COLORS.green,
            opacity: pulseOpacity,
          }}
        />
      ) : null}
      <Typewriter
        text={text}
        charFrames={2}
        delayInFrames={delay}
        showCursor={false}
        style={{
          color,
          fontFamily: font.mono,
          fontSize: 18,
          fontWeight: 400,
        }}
      />
    </div>
  );
};

const SceneTwoLeft: React.FC = () => (
  <LeftSceneSlot>
    <FadeOut delayInFrames={140} durationInFrames={14}>
      <div>
        <SlideUp delayInFrames={18} durationInFrames={28} distance={42}>
          <h2 style={largeLineStyle}>One CLI.</h2>
        </SlideUp>
        <SlideUp delayInFrames={36} durationInFrames={28} distance={42}>
          <h2 style={{ ...largeLineStyle, color: COLORS.accent }}>
            Every motion primitive.
          </h2>
        </SlideUp>
        <FadeIn delayInFrames={70} durationInFrames={14}>
          <InlineProgressBar />
        </FadeIn>
      </div>
    </FadeOut>
  </LeftSceneSlot>
);

const SceneTwoRight: React.FC = () => (
  <RightSceneSlot>
    <FadeIn durationInFrames={12}>
      <Sequence from={12} durationInFrames={46} layout="none">
        <CounterDemo />
      </Sequence>
      <Sequence from={60} durationInFrames={46} layout="none">
        <PillsDemo />
      </Sequence>
      <Sequence from={108} durationInFrames={48} layout="none">
        <TypewriterDemo />
      </Sequence>
    </FadeIn>
  </RightSceneSlot>
);

const CounterDemo: React.FC = () => (
  <DemoSlot>
    <FadeOut delayInFrames={40} durationInFrames={8}>
      <div style={demoCardStyle}>
        <FadeIn durationInFrames={10}>
          <p style={demoLabelStyle}>components installed</p>
        </FadeIn>
        <Counter
          from={0}
          to={9}
          durationInFrames={36}
          style={{
            fontFamily: font.sans,
            fontSize: 128,
            fontWeight: 900,
            lineHeight: 1,
          }}
        />
        <FadeIn delayInFrames={20} durationInFrames={10}>
          <p style={{ margin: "14px 0 0", color: COLORS.dim, fontSize: 18 }}>
            +more coming
          </p>
        </FadeIn>
      </div>
    </FadeOut>
  </DemoSlot>
);

const PillsDemo: React.FC = () => (
  <DemoSlot>
    <FadeOut delayInFrames={40} durationInFrames={10}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 14,
          width: 600,
        }}
      >
        <StaggerChildren staggerInFrames={6}>
          {pillItems.map(([label, color]) => (
            <SlideUp key={label} distance={24} durationInFrames={24}>
              <div style={{ ...pillStyle, color }}>{label}</div>
            </SlideUp>
          ))}
        </StaggerChildren>
      </div>
    </FadeOut>
  </DemoSlot>
);

const TypewriterDemo: React.FC = () => (
  <DemoSlot>
    <FadeOut delayInFrames={40} durationInFrames={8}>
      <div style={{ maxWidth: 620, textAlign: "center" }}>
        <Typewriter
          text="Production-ready. Frame-true. Yours."
          charFrames={2}
          showCursor={false}
          style={{
            color: COLORS.text,
            fontFamily: font.sans,
            fontSize: 44,
            fontWeight: 800,
            lineHeight: 1.18,
          }}
        />
        <div style={{ marginTop: 18 }}>
          <WordHighlight
            text="Frame-true motion"
            highlightWord="Frame-true"
            delayInFrames={36}
            durationInFrames={18}
            color={COLORS.secondary}
            highlightColor="rgba(99, 102, 241, 0.22)"
            fontSize={24}
            fontWeight={700}
          />
        </div>
      </div>
    </FadeOut>
  </DemoSlot>
);

const SceneThreeLeft: React.FC = () => (
  <LeftSceneSlot>
    <FadeOut delayInFrames={100} durationInFrames={18}>
      <div style={{ display: "grid", gap: 22 }}>
        <StaggerChildren staggerInFrames={22} baseDelayInFrames={8}>
          {valueRows.map(([label, color]) => (
            <SlideUp key={label} distance={26} durationInFrames={28}>
              <div style={valueRowStyle}>
                <span style={{ ...dotStyle, backgroundColor: color }} />
                <span>{label}</span>
              </div>
            </SlideUp>
          ))}
        </StaggerChildren>
      </div>
    </FadeOut>
  </LeftSceneSlot>
);

const SceneThreeRight: React.FC = () => (
  <RightSceneSlot>
    <FadeOut delayInFrames={112} durationInFrames={12}>
      <div style={{ position: "relative" }}>
        <FadeIn delayInFrames={100} durationInFrames={15}>
          <div style={codeGlowStyle} />
        </FadeIn>
        <SpringIn delayInFrames={2} durationInFrames={34}>
          <div style={codeCardStyle}>
            <WindowChrome />
            <CodeImportLine
              delay={12}
              name="FadeIn"
              path="@/remotion/primitives/fade-in"
            />
            <CodeImportLine
              delay={58}
              name="Counter"
              path="@/remotion/primitives/counter"
            />
            <CodeImportLine
              delay={106}
              name="Typewriter"
              path="@/remotion/primitives/typewriter"
            />
          </div>
        </SpringIn>
      </div>
    </FadeOut>
  </RightSceneSlot>
);

const CodeImportLine: React.FC<{
  name: string;
  path: string;
  delay: number;
}> = ({ name, path, delay }) => (
  <div style={{ minHeight: 28, fontFamily: font.mono, fontSize: 17 }}>
    <Typewriter
      text={`import { ${name} } from "${path}";`}
      charFrames={1}
      delayInFrames={delay}
      showCursor={false}
      style={{
        color: COLORS.accentLight,
        fontFamily: font.mono,
        fontSize: 17,
        fontWeight: 400,
        lineHeight: "28px",
      }}
    />
  </div>
);

const SceneFour: React.FC = () => (
  <AbsoluteFill
    style={{
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.bg,
    }}
  >
    <div style={{ textAlign: "center", transform: "translateY(-8px)" }}>
      <RotateIn durationInFrames={30} degrees={-14}>
        <p
          style={{
            ...eyebrowStyle,
            marginBottom: 20,
            color: COLORS.text,
            fontSize: 22,
            letterSpacing: 4,
          }}
        >
          RemotionUI
        </p>
      </RotateIn>
      <FadeIn delayInFrames={20} durationInFrames={18}>
        <p
          style={{
            margin: 0,
            color: "#777777",
            fontSize: 34,
            lineHeight: 1.25,
          }}
        >
          Registry-first motion components for Remotion.
        </p>
      </FadeIn>
      <ScaleIn delayInFrames={40} durationInFrames={20}>
        <div style={commandPillStyle}>
          <span style={{ color: COLORS.muted }}>$</span>
          <Typewriter
            text="npx remotion-ui@latest init my-video"
            charFrames={2}
            delayInFrames={8}
            showCursor={false}
            style={{
              color: COLORS.accentLight,
              fontFamily: font.mono,
              fontSize: 18,
            }}
          />
          <BlinkCursor />
        </div>
      </ScaleIn>
    </div>
  </AbsoluteFill>
);

const InlineProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [70, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div style={{ marginTop: 46, width: 330 }}>
      <div
        style={{
          height: 4,
          borderRadius: 999,
          overflow: "hidden",
          backgroundColor: COLORS.border,
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accentLight})`,
          }}
        />
      </div>
      <p
        style={{
          margin: "14px 0 0",
          color: "#444444",
          fontSize: 16,
          letterSpacing: 1.8,
          textTransform: "uppercase",
        }}
      >
        9 primitives. source-owned.
      </p>
    </div>
  );
};

const BlinkCursor: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = frame >= 80 && Math.floor(frame / 8) % 2 === 0 ? 1 : 0;

  return (
    <span
      style={{
        width: 2,
        height: 22,
        borderRadius: 2,
        backgroundColor: COLORS.accent,
        opacity,
      }}
    />
  );
};

const BackgroundTexture: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drift = spring({
    frame,
    fps,
    config: { mass: 1, damping: 22, stiffness: 24 },
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.52,
          background:
            "radial-gradient(circle at 18% 42%, rgba(99,102,241,0.12), transparent 32%), radial-gradient(circle at 76% 28%, rgba(165,180,252,0.08), transparent 30%)",
          transform: `translate3d(${drift * 16}px, ${drift * -10}px, 0)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.16,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </AbsoluteFill>
  );
};

const WindowChrome: React.FC = () => (
  <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
    {["#ff5f57", "#ffbd2e", "#28c840"].map((color) => (
      <span
        key={color}
        style={{
          width: 12,
          height: 12,
          borderRadius: 999,
          backgroundColor: color,
        }}
      />
    ))}
  </div>
);

const LeftSceneSlot: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "flex-start",
      paddingLeft: 110,
      paddingRight: 90,
      boxSizing: "border-box",
    }}
  >
    {children}
  </AbsoluteFill>
);

const RightSceneSlot: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "center",
      padding: "76px 84px",
      boxSizing: "border-box",
    }}
  >
    {children}
  </AbsoluteFill>
);

const DemoSlot: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    {children}
  </AbsoluteFill>
);

const eyebrowStyle: CSSProperties = {
  margin: "0 0 28px",
  color: COLORS.muted,
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: 3,
  lineHeight: 1,
  textTransform: "uppercase",
};

const largeLineStyle: CSSProperties = {
  margin: 0,
  fontSize: 74,
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: -1.4,
};

const terminalCardStyle: CSSProperties = {
  width: 660,
  borderRadius: 14,
  border: `1px solid ${COLORS.borderDim}`,
  backgroundColor: COLORS.surface,
  padding: "32px 36px",
  fontFamily: font.mono,
  boxShadow: "0 28px 90px rgba(0,0,0,0.42)",
};

const demoCardStyle: CSSProperties = {
  width: 580,
  height: 280,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 16,
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.surface,
  boxShadow: "0 24px 80px rgba(0,0,0,0.32)",
};

const demoLabelStyle: CSSProperties = {
  margin: "0 0 12px",
  color: COLORS.muted,
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: 2,
  textTransform: "uppercase",
};

const pillStyle: CSSProperties = {
  minHeight: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  border: "1px solid #242424",
  backgroundColor: "#161616",
  fontSize: 18,
  fontWeight: 700,
};

const valueRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  color: "#e5e5e5",
  fontSize: 30,
  fontWeight: 650,
};

const dotStyle: CSSProperties = {
  width: 10,
  height: 10,
  flex: "0 0 auto",
  borderRadius: 999,
  boxShadow: "0 0 22px currentColor",
};

const codeCardStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: 660,
  minHeight: 340,
  display: "grid",
  alignContent: "start",
  gap: 18,
  borderRadius: 14,
  border: `1px solid ${COLORS.borderDim}`,
  backgroundColor: COLORS.card,
  padding: "28px 32px",
  fontFamily: font.mono,
  boxShadow: "0 28px 90px rgba(0,0,0,0.4)",
};

const codeGlowStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  zIndex: 0,
  width: 760,
  height: 360,
  transform: "translate(-50%, -50%)",
  background:
    "radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)",
};

const commandPillStyle: CSSProperties = {
  marginTop: 34,
  display: "inline-flex",
  alignItems: "center",
  gap: 16,
  minHeight: 58,
  borderRadius: 10,
  border: "1px solid #222222",
  backgroundColor: COLORS.surface,
  padding: "14px 28px",
  fontFamily: font.mono,
  fontSize: 18,
  boxShadow: "0 18px 70px rgba(0,0,0,0.35)",
};
