import type { Caption } from "@remotion/captions";

export const DEMO_AUDIO_SRC =
  "https://remotion.media/audio.wav";

const svgData = (svg: string) =>
  `data:image/svg+xml,${encodeURIComponent(svg)}`;

export const DEMO_MEDIA_SRC = svgData(`
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#111827"/>
      <stop offset="1" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <circle cx="1030" cy="146" r="190" fill="#93c5fd" opacity=".25"/>
  <rect x="104" y="96" width="650" height="430" rx="42" fill="#f8fafc" opacity=".12"/>
  <rect x="154" y="154" width="450" height="38" rx="19" fill="#f8fafc" opacity=".78"/>
  <rect x="154" y="224" width="312" height="28" rx="14" fill="#bfdbfe" opacity=".95"/>
  <rect x="154" y="306" width="500" height="112" rx="28" fill="#020617" opacity=".42"/>
  <rect x="804" y="342" width="300" height="118" rx="34" fill="#f8fafc" opacity=".14"/>
  <text x="112" y="610" font-family="Arial,sans-serif" font-size="60" font-weight="800" fill="#f8fafc">Launch dashboard</text>
  <text x="114" y="658" font-family="Arial,sans-serif" font-size="28" fill="#bfdbfe">Feature story, KPI, and product frame</text>
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
export const DEMO_LOGO_SRC = svgData(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
  <rect width="32" height="32" rx="8" fill="#60a5fa"/>
  <rect x="5" y="6" width="18" height="13" rx="3" stroke="#fff" stroke-width="1.25" fill="none" opacity="0.35"/>
  <rect x="9" y="10" width="18" height="13" rx="3" fill="#0c1222" stroke="#fff" stroke-width="1.5" opacity="0.95"/>
  <path d="M15.5 14.5v5l4.5-2.5-4.5-2.5z" fill="#60a5fa"/>
</svg>`);

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

export const DEMO_LINE_POINTS = [
  { x: 0, y: 12 },
  { x: 1, y: 18 },
  { x: 2, y: 16 },
  { x: 3, y: 28 },
  { x: 4, y: 44 },
  { x: 5, y: 52 },
];
