import type { Caption } from "@remotion/captions";

/**
 * Placeholder media so an installed composition renders something on the very
 * first `npx remotion run` instead of an empty frame.
 *
 * Everything here is meant to be replaced. The stills are inline SVG data URIs
 * rather than files so nothing has to be copied into `public/`, and the audio
 * is a hosted loop rather than a `staticFile()` for the same reason — a fresh
 * project has neither.
 */

const svgData = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

const ACCENT = "#e8b86d";

/**
 * Eight-second music loop with a beat and a chord change per bar.
 *
 * Remote on purpose: `staticFile()` would point at an asset the installing
 * project does not have. Swap it for your own audio — `useWindowedAudioData()`
 * only accepts `.wav`.
 */
export const SAMPLE_AUDIO_SRC = "https://remotionui.com/media/demo-loop.wav";

/** Product still, framed 16:9. */
export const SAMPLE_STILL_SRC = svgData(`
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#111827"/>
      <stop offset="1" stop-color="#1a1510"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <circle cx="1030" cy="146" r="190" fill="${ACCENT}" opacity=".18"/>
  <rect x="104" y="96" width="650" height="430" rx="42" fill="#f8fafc" opacity=".12"/>
  <rect x="154" y="154" width="450" height="38" rx="19" fill="#f8fafc" opacity=".78"/>
  <rect x="154" y="224" width="312" height="28" rx="14" fill="#f59e0b" opacity=".85"/>
  <rect x="154" y="306" width="500" height="112" rx="28" fill="#020617" opacity=".42"/>
  <rect x="804" y="342" width="300" height="118" rx="34" fill="#f8fafc" opacity=".14"/>
  <rect x="154" y="580" width="380" height="24" rx="12" fill="#f8fafc" opacity=".22"/>
  <rect x="154" y="628" width="240" height="18" rx="9" fill="#f8fafc" opacity=".12"/>
</svg>`);

/** Second still, warmer, so a stack of them doesn't read as one repeated card. */
export const SAMPLE_STILL_ALT_SRC = svgData(`
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#070812"/>
  <path d="M0 520 C180 420 340 580 520 460 C720 326 850 390 1020 250 C1120 170 1210 150 1280 120 L1280 720 L0 720 Z" fill="#ec4899" opacity=".30"/>
  <rect x="730" y="100" width="350" height="440" rx="58" fill="#fdf2f8" opacity=".12"/>
  <circle cx="905" cy="292" r="118" fill="#f9a8d4" opacity=".80"/>
  <rect x="804" y="452" width="210" height="36" rx="18" fill="#fdf2f8" opacity=".70"/>
  <rect x="110" y="180" width="300" height="30" rx="15" fill="#f8fafc" opacity=".26"/>
  <rect x="112" y="256" width="200" height="20" rx="10" fill="#f9a8d4" opacity=".34"/>
</svg>`);

/** Third still, cooler, for the last slot in a b-roll stack. */
export const SAMPLE_STILL_THIRD_SRC = svgData(`
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#101827"/>
  <rect x="120" y="92" width="1040" height="536" rx="46" fill="#f8fafc" opacity=".09"/>
  <rect x="170" y="160" width="294" height="360" rx="32" fill="#34d399" opacity=".74"/>
  <rect x="520" y="166" width="570" height="54" rx="27" fill="#f8fafc" opacity=".76"/>
  <rect x="520" y="260" width="470" height="34" rx="17" fill="#cbd5e1" opacity=".7"/>
  <rect x="520" y="326" width="520" height="34" rx="17" fill="#cbd5e1" opacity=".44"/>
  <rect x="520" y="448" width="260" height="72" rx="36" fill="#34d399"/>
  <rect x="176" y="560" width="300" height="26" rx="13" fill="#f8fafc" opacity=".22"/>
</svg>`);

/** Four words of sample transcript, timed against the first two seconds. */
export const SAMPLE_CAPTIONS: Caption[] = [
  { text: " Install", startMs: 0, endMs: 360, timestampMs: 0, confidence: 1 },
  { text: " components", startMs: 360, endMs: 780, timestampMs: 360, confidence: 1 },
  { text: " as", startMs: 780, endMs: 980, timestampMs: 780, confidence: 1 },
  { text: " source", startMs: 980, endMs: 1800, timestampMs: 980, confidence: 1 },
];
