import type { Caption } from "@remotion/captions";
import { BRAND_MARK_SVG } from "./brand-mark-svg";

export const DEMO_AUDIO_SRC =
  "https://remotion.media/audio.wav";

/** Curated demo palette — see skills/remotion-ui/rules/component-polish.md */
export const DEMO_PALETTE = {
  phosphor: "#e8b86d",
  amber: "#f59e0b",
  teal: "#2dd4bf",
  rose: "#f472b6",
  bg: "#080810",
  bgRaised: "#0c0c14",
  text: "#fafafa",
  muted: "#71717a",
} as const;

/** Docs preview backdrop — matches caption-scene / audiogram-scene plate */
export const SCENE_PREVIEW_GRADIENT =
  `radial-gradient(circle at 18% 18%, rgba(232,184,109,0.14) 0%, transparent 46%), radial-gradient(circle at 82% 64%, rgba(45,212,191,0.10) 0%, transparent 52%), linear-gradient(to bottom, #050510 0%, ${DEMO_PALETTE.bg} 100%)`;

/** Aspect presets for docs preview QA */
export const PREVIEW_LANDSCAPE = { width: 960, height: 540 } as const;
export const PREVIEW_PORTRAIT = { width: 1080, height: 1920 } as const;
export const PREVIEW_HD = { width: 1920, height: 1080 } as const;

/** Story-specific copy deck — avoid tagline reuse across previews */
export const DEMO_COPY = {
  productLaunch: {
    title: "Frame registry",
    subtitle: "Install compositions as source you own",
    featureTitle: "Three layers in your repo",
    featureItems: [
      "Motion primitives you can edit",
      "Scenes for hooks, charts, and captions",
      "Compositions that wire the full story",
    ],
  },
  creatorHook: {
    eyebrow: "Creator insight",
    headline: "Make the first second count",
    subtitle: "Hook viewers before they scroll",
  },
  creatorComment: {
    author: "Alex Chen",
    handle: "@alexchen",
    body: "Can you break down how you built that transition?",
  },
  dataStory: {
    title: "Quarterly reach by channel",
    subtitle: "Short-form climbed while long-form held attention",
    chartTitle: "Views by format",
    metricsTitle: "Signals that mattered",
    timelineTitle: "How we read the quarter",
    insightEyebrow: "Takeaway",
    ctaTitle: "Turn your data into motion",
    statValue: 3,
    statLabel: "Runtime dependencies",
    statSuffix: "",
  },
  podcast: {
    title: "Ship faster with source",
    subtitle: "Edit every frame in your repo",
  },
  tutorial: {
    calloutTitle: "Wire the composition",
    calloutSubtitle: "Drop scenes into TransitionSeries",
  },
  quote: {
    text: "The best motion is code you can read and change.",
    attribution: "Remotion team",
  },
  endCard: {
    ctaLabel: "Browse components",
    ctaUrl: "remotionui.dev/docs/components",
  },
} as const;

const svgData = (svg: string) =>
  `data:image/svg+xml,${encodeURIComponent(svg)}`;

export const DEMO_MEDIA_SRC = svgData(`
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#111827"/>
      <stop offset="1" stop-color="#1a1510"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <circle cx="1030" cy="146" r="190" fill="${DEMO_PALETTE.phosphor}" opacity=".18"/>
  <rect x="104" y="96" width="650" height="430" rx="42" fill="#f8fafc" opacity=".12"/>
  <rect x="154" y="154" width="450" height="38" rx="19" fill="#f8fafc" opacity=".78"/>
  <rect x="154" y="224" width="312" height="28" rx="14" fill="${DEMO_PALETTE.amber}" opacity=".85"/>
  <rect x="154" y="306" width="500" height="112" rx="28" fill="#020617" opacity=".42"/>
  <rect x="804" y="342" width="300" height="118" rx="34" fill="#f8fafc" opacity=".14"/>
  <text x="112" y="610" font-family="Arial,sans-serif" font-size="60" font-weight="700" fill="#f8fafc">Launch dashboard</text>
  <text x="114" y="658" font-family="Arial,sans-serif" font-size="28" fill="${DEMO_PALETTE.phosphor}">Feature story, KPI, and product frame</text>
</svg>`);

export const DEMO_MEDIA_ALT_SRC = svgData(`
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#070812"/>
  <path d="M0 520 C180 420 340 580 520 460 C720 326 850 390 1020 250 C1120 170 1210 150 1280 120 L1280 720 L0 720 Z" fill="#ec4899" opacity=".30"/>
  <rect x="730" y="100" width="350" height="440" rx="58" fill="#fdf2f8" opacity=".12"/>
  <circle cx="905" cy="292" r="118" fill="#f9a8d4" opacity=".80"/>
  <rect x="804" y="452" width="210" height="36" rx="18" fill="#fdf2f8" opacity=".70"/>
  <text x="110" y="210" font-family="Arial,sans-serif" font-size="70" font-weight="800" fill="#f8fafc">Creator cut</text>
  <text x="112" y="286" font-family="Arial,sans-serif" font-size="34" fill="#f9a8d4">Talking head, captions, and proof clips</text>
</svg>`);

export const DEMO_MEDIA_THIRD_SRC = svgData(`
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#101827"/>
  <rect x="120" y="92" width="1040" height="536" rx="46" fill="#f8fafc" opacity=".09"/>
  <rect x="170" y="160" width="294" height="360" rx="32" fill="#34d399" opacity=".74"/>
  <rect x="520" y="166" width="570" height="54" rx="27" fill="#f8fafc" opacity=".76"/>
  <rect x="520" y="260" width="470" height="34" rx="17" fill="#cbd5e1" opacity=".7"/>
  <rect x="520" y="326" width="520" height="34" rx="17" fill="#cbd5e1" opacity=".44"/>
  <rect x="520" y="448" width="260" height="72" rx="36" fill="#34d399"/>
  <text x="176" y="584" font-family="Arial,sans-serif" font-size="42" font-weight="800" fill="#f8fafc">Publish screen</text>
</svg>`);

/** RemotionUI logo mark — matches apps/web/public/logo.svg */
export const DEMO_LOGO_SRC = svgData(BRAND_MARK_SVG);

export const DEMO_SOCIAL_CLIP_CAPTIONS: Caption[] = [
  { text: " Install", startMs: 0, endMs: 360, timestampMs: 0, confidence: 1 },
  { text: " components", startMs: 360, endMs: 780, timestampMs: 360, confidence: 1 },
  { text: " as", startMs: 780, endMs: 980, timestampMs: 780, confidence: 1 },
  { text: " source", startMs: 980, endMs: 1800, timestampMs: 980, confidence: 1 },
];

export const DEMO_CAPTIONS: Caption[] = [
  { text: " Clip", startMs: 0, endMs: 400, timestampMs: 0, confidence: 1 },
  { text: " the", startMs: 400, endMs: 600, timestampMs: 400, confidence: 1 },
  {
    text: " sharpest",
    startMs: 600,
    endMs: 1200,
    timestampMs: 600,
    confidence: 1,
  },
  {
    text: " moment",
    startMs: 1200,
    endMs: 2000,
    timestampMs: 1200,
    confidence: 1,
  },
];

/** Stylized “R” mark for logo-reveal / path-draw demos */
export const DEMO_LOGO_PATH =
  "M 52 28 L 52 172 L 96 172 Q 138 172 138 128 Q 138 96 108 88 L 144 28 L 112 28 L 92 78 L 84 78 L 84 28 Z";

export const DEMO_BAR_DATA = [
  { label: "Shorts", value: 124000 },
  { label: "Podcast", value: 82000 },
  { label: "Docs", value: 64000 },
  { label: "Launch", value: 48000 },
];

export const DEMO_METRICS = [
  { label: "Views", value: 124000, suffix: "", delta: "+18%" },
  { label: "Watch time", value: 48, suffix: "min", delta: "+6%" },
  { label: "Shares", value: 3200, suffix: "", delta: "+24%" },
];

export const DEMO_TIMELINE_STEPS = [
  { title: "Hook", description: "Lead with the sharpest insight." },
  { title: "Proof", description: "Show the chart and metrics." },
  { title: "CTA", description: "Close with one clear next step." },
];

export const DEMO_LINE_POINTS = [
  { x: 0, y: 12 },
  { x: 1, y: 18 },
  { x: 2, y: 16 },
  { x: 3, y: 28 },
  { x: 4, y: 44 },
  { x: 5, y: 52 },
];
