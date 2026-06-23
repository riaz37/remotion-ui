import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BlockCaret,
  fadeUp,
  introBounce,
  morphProgress,
  stageScale,
  useTypedPrompt,
} from "@/remotion/lib/ai-composer-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type V0ComposerProps = {
  greeting?: string;
  placeholder?: string;
  prompt?: string;
  modelName?: string;
  projectName?: string;
  theme?: "light" | "dark";
};

const QUICK_ACTIONS = [
  "Contact Form",
  "Image Editor",
  "Mini Game",
  "Finance Calculator",
];

const TEMPLATES = [
  { name: "Next.js", copy: "Build full-stack React apps", mark: "N" },
  { name: "Supabase", copy: "Spin up Postgres with auth", mark: "S" },
  { name: "Neon", copy: "Start with Serverless", mark: "N" },
  { name: "Upstash", copy: "Serverless Redis and queues", mark: "U" },
];

const THEMES = {
  light: {
    page: "#ffffff",
    surface: "#ffffff",
    border: "#e6e6e6",
    fg: "#0a0a0a",
    muted: "#737373",
    faint: "#a3a3a3",
    chip: "#ffffff",
    btn: "#0a0a0a",
    btnFg: "#ffffff",
    accent: "#00a76f",
  },
  dark: {
    page: "#050505",
    surface: "#0d0d0d",
    border: "#2b2b2b",
    fg: "#ededed",
    muted: "#a3a3a3",
    faint: "#737373",
    chip: "#0d0d0d",
    btn: "#ffffff",
    btnFg: "#050505",
    accent: "#00d084",
  },
} as const;

const IconBox: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <div
    style={{
      width: 28,
      height: 28,
      borderRadius: 7,
      background: "#0a0a0a",
      color,
      display: "grid",
      placeItems: "center",
      fontSize: 14,
      fontWeight: 750,
    }}
  >
    {label}
  </div>
);

const SmallIcon: React.FC<{ kind: "image" | "figma" | "upload" | "page" }> = ({
  kind,
}) => {
  const path =
    kind === "image"
      ? "M5 17l4-5 3 3 2-2 5 4M5 5h14v14H5z"
      : kind === "figma"
        ? "M9 3h3a3 3 0 0 1 0 6H9V3zm0 6h3a3 3 0 0 1 0 6H9V9zm0 6h3a3 3 0 1 1-3 3v-3zm0-12a3 3 0 0 0 0 6h3V3H9z"
        : kind === "upload"
          ? "M12 16V4M7 9l5-5 5 5M5 20h14"
          : "M5 5h14v14H5zM8 9h8M8 13h5";
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden>
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  );
};

export const V0Composer: React.FC<V0ComposerProps> = ({
  greeting = "What do you want to create?",
  placeholder = "Ask v0 to build...",
  prompt = "a landing page for my SaaS with pricing and testimonials",
  modelName = "v0 Mini",
  projectName = "New Chat",
  theme = "light",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = THEMES[theme];
  const scale = stageScale(width, height);
  const tw = useTypedPrompt({ prompt, startFrame: 36, cps: 24 });
  const send = morphProgress(frame, fps, 82);
  const intro = introBounce(frame, fps);
  const heading = fadeUp(frame, [6, 22]);
  const composer = fadeUp(frame, [12, 28]);
  const actions = fadeUp(frame, [20, 36]);
  const templates = fadeUp(frame, [42, 64]);

  return (
    <AbsoluteFill style={{ background: t.page, fontFamily }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 1280,
          height: 720,
          transform: `translate(-50%, -50%) scale(${scale})`,
          color: t.fg,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: t.muted,
            fontSize: 14,
          }}
        >
          <div style={{ width: 16, height: 16, border: `2px solid ${t.fg}`, borderRadius: 3 }} />
          <span>{projectName}</span>
        </div>
        <div
          style={{
            position: "absolute",
            right: 34,
            top: 22,
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 14,
            color: t.muted,
          }}
        >
          <span>Templates</span>
          <span>Resources</span>
          <span>Enterprise</span>
          <span>Pricing</span>
          <span
            style={{
              padding: "8px 13px",
              borderRadius: 999,
              color: t.btnFg,
              background: t.btn,
              fontWeight: 650,
            }}
          >
            Sign Up
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 110,
            display: "flex",
            justifyContent: "center",
            gap: 9,
            color: t.muted,
            fontSize: 14,
          }}
        >
          {QUICK_ACTIONS.map((action) => (
            <span key={action}>{action}</span>
          ))}
        </div>

        <h1
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 156,
            margin: 0,
            textAlign: "center",
            fontSize: 48,
            lineHeight: 1.08,
            fontWeight: 750,
            letterSpacing: 0,
            opacity: heading.opacity,
            transform: `translateY(${heading.translateY}px)`,
          }}
        >
          {greeting}
        </h1>

        <div
          style={{
            position: "absolute",
            left: 270,
            top: 248,
            width: 740,
            height: 92,
            borderRadius: 14,
            border: `1px solid ${t.border}`,
            background: t.surface,
            boxShadow: theme === "light" ? "0 8px 24px rgba(0,0,0,0.05)" : "none",
            display: "grid",
            gridTemplateRows: "1fr 34px",
            opacity: composer.opacity,
            transform: `translateY(${composer.translateY + intro.translateY * 0.35}px) scale(${intro.scale})`,
            transformOrigin: "center top",
          }}
        >
          <div
            style={{
              padding: "14px 16px 6px",
              color: tw.count > 0 ? t.fg : t.faint,
              fontSize: 17,
              lineHeight: 1.35,
            }}
          >
            {tw.count > 0 ? (
              <>
                {tw.text}
                <BlockCaret color={t.fg} blink={!tw.typing} height={19} />
              </>
            ) : (
              placeholder
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 12px 10px",
              color: t.muted,
              fontSize: 13,
            }}
          >
            <span style={{ color: t.accent, fontWeight: 800 }}>v0</span>
            <span>{modelName}</span>
            <span style={{ transform: "translateY(-1px)" }}>⌄</span>
            <div style={{ flex: 1 }} />
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                display: "grid",
                placeItems: "center",
                background: send > 0.25 ? t.btn : "transparent",
                border: send > 0.25 ? "none" : `1px solid ${t.border}`,
                color: send > 0.25 ? t.btnFg : t.muted,
                fontWeight: 800,
              }}
            >
              {send > 0.5 ? "↑" : "+"}
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 356,
            display: "flex",
            justifyContent: "center",
            gap: 10,
            opacity: actions.opacity,
            transform: `translateY(${actions.translateY}px)`,
          }}
        >
          {[
            ["image", "Clone a Screenshot"],
            ["figma", "Import from Figma"],
            ["upload", "Upload a Project"],
            ["page", "Landing Page"],
          ].map(([kind, label]) => (
            <div
              key={label}
              style={{
                height: 34,
                padding: "0 13px",
                borderRadius: 999,
                border: `1px solid ${t.border}`,
                background: t.chip,
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: t.muted,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <SmallIcon kind={kind as "image" | "figma" | "upload" | "page"} />
              {label}
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: 84,
            right: 84,
            top: 476,
            opacity: templates.opacity,
            transform: `translateY(${templates.translateY}px)`,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 650 }}>Start with a template</div>
          <div style={{ marginTop: 6, color: t.muted, fontSize: 14 }}>
            Get started instantly with a framework or integration of your choice.
          </div>
          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
            }}
          >
            {TEMPLATES.map((template, index) => (
              <div
                key={template.name}
                style={{
                  minHeight: 114,
                  borderRadius: 12,
                  border: `1px solid ${t.border}`,
                  background: t.surface,
                  padding: 18,
                  transform: `translateY(${Math.max(0, 1 - templates.opacity) * (12 + index * 4)}px)`,
                }}
              >
                <IconBox label={template.mark} color={index === 0 ? "#ffffff" : t.accent} />
                <div style={{ marginTop: 14, fontSize: 15, fontWeight: 700 }}>
                  {template.name}
                </div>
                <div style={{ marginTop: 5, color: t.muted, fontSize: 13 }}>
                  {template.copy}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
