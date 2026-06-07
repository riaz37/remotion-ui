import type { Caption } from "@remotion/captions";

export const DEMO_AUDIO_SRC =
  "https://remotion.media/audio.wav";

export const DEMO_MEDIA_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720' viewBox='0 0 1280 720'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%230f172a'/%3E%3Cstop offset='1' stop-color='%231d4ed8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1280' height='720' fill='url(%23g)'/%3E%3Ccircle cx='1010' cy='140' r='180' fill='%2360a5fa' opacity='.28'/%3E%3Crect x='120' y='120' width='560' height='340' rx='34' fill='%23f8fafc' opacity='.12'/%3E%3Crect x='160' y='170' width='420' height='34' rx='17' fill='%23f8fafc' opacity='.72'/%3E%3Crect x='160' y='238' width='300' height='24' rx='12' fill='%2360a5fa' opacity='.9'/%3E%3Crect x='160' y='302' width='460' height='112' rx='24' fill='%23020617' opacity='.38'/%3E%3Ctext x='120' y='590' font-family='Arial,sans-serif' font-size='58' font-weight='800' fill='%23f8fafc'%3ERemotionUI Demo%3C/text%3E%3C/svg%3E";

export const DEMO_MEDIA_ALT_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720' viewBox='0 0 1280 720'%3E%3Crect width='1280' height='720' fill='%23020617'/%3E%3Cpath d='M0 520 C180 420 340 580 520 460 C720 326 850 390 1020 250 C1120 170 1210 150 1280 120 L1280 720 L0 720 Z' fill='%2360a5fa' opacity='.34'/%3E%3Crect x='700' y='120' width='390' height='390' rx='44' fill='%23f8fafc' opacity='.11'/%3E%3Ccircle cx='895' cy='315' r='110' fill='%2360a5fa' opacity='.8'/%3E%3Ctext x='110' y='210' font-family='Arial,sans-serif' font-size='68' font-weight='800' fill='%23f8fafc'%3ECreator frame%3C/text%3E%3Ctext x='112' y='286' font-family='Arial,sans-serif' font-size='34' fill='%2394a3b8'%3EUseful video layouts, not web widgets.%3C/text%3E%3C/svg%3E";

export const DEMO_MEDIA_THIRD_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720' viewBox='0 0 1280 720'%3E%3Crect width='1280' height='720' fill='%23111827'/%3E%3Crect x='120' y='100' width='1040' height='520' rx='42' fill='%23f8fafc' opacity='.08'/%3E%3Crect x='170' y='165' width='280' height='360' rx='28' fill='%2360a5fa' opacity='.75'/%3E%3Crect x='500' y='165' width='590' height='50' rx='25' fill='%23f8fafc' opacity='.75'/%3E%3Crect x='500' y='255' width='470' height='34' rx='17' fill='%2394a3b8' opacity='.7'/%3E%3Crect x='500' y='320' width='520' height='34' rx='17' fill='%2394a3b8' opacity='.42'/%3E%3Crect x='500' y='430' width='250' height='70' rx='35' fill='%2360a5fa'/%3E%3C/svg%3E";

export const DEMO_CAPTIONS: Caption[] = [
  { text: " Welcome", startMs: 0, endMs: 400, timestampMs: 0, confidence: 1 },
  { text: " to", startMs: 400, endMs: 600, timestampMs: 400, confidence: 1 },
  {
    text: " RemotionUI",
    startMs: 600,
    endMs: 1200,
    timestampMs: 600,
    confidence: 1,
  },
  {
    text: " signals",
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
