"use client";

import { AbsoluteFill } from "remotion";
import { SportsScorebug } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * A broadcast feed to hang the furniture on: crowd, court in camera
 * perspective, centre circle and both keys.
 *
 * Two stacked gradients were placeholder-grade for a component whose entire
 * premise is furniture over a live feed, and the product stills in
 * `lib/demo-assets` are dashboard cards — a scorebug over a KPI screen reads
 * as two unrelated demos in one frame.
 */
const BroadcastBackdrop: React.FC = () => (
  <AbsoluteFill style={{ background: "#0a1016" }}>
    <svg
      viewBox="0 0 1280 720"
      preserveAspectRatio="none"
      style={{ width: "100%", height: "100%" }}
    >
      <defs>
        <linearGradient id="sb-crowd" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#101a22" />
          <stop offset="1" stopColor="#1b2a33" />
        </linearGradient>
        <linearGradient id="sb-floor" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#3a2a1a" />
          <stop offset="0.45" stopColor="#6b4a24" />
          <stop offset="1" stopColor="#8a5f2c" />
        </linearGradient>
        <linearGradient id="sb-key" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#9d6a2c" />
          <stop offset="1" stopColor="#b07a34" />
        </linearGradient>
        <radialGradient id="sb-light" cx="0.5" cy="0.18" r="0.7">
          <stop stopColor="rgba(255,238,205,0.30)" />
          <stop offset="1" stopColor="rgba(255,238,205,0)" />
        </radialGradient>
      </defs>

      {/* Stand */}
      <rect width="1280" height="266" fill="url(#sb-crowd)" />
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <rect
          key={`seat-${row}`}
          x={-40}
          y={40 + row * 34}
          width={1360}
          height={12}
          rx={6}
          fill="#7dd3e8"
          opacity={0.05 + row * 0.015}
        />
      ))}
      <rect y={236} width="1280" height="30" fill="#060a0d" opacity={0.75} />

      {/* Court in camera perspective */}
      <polygon points="200,266 1080,266 1480,720 -200,720" fill="url(#sb-floor)" />
      <polygon
        points="200,266 1080,266 1480,720 -200,720"
        fill="none"
        stroke="#f6f1e6"
        strokeOpacity="0.55"
        strokeWidth="5"
      />
      {/* Halfway line and centre circle */}
      <line
        x1="212"
        y1="452"
        x2="1068"
        y2="452"
        stroke="#f6f1e6"
        strokeOpacity="0.42"
        strokeWidth="4"
      />
      <ellipse
        cx="640"
        cy="452"
        rx="150"
        ry="48"
        fill="none"
        stroke="#f6f1e6"
        strokeOpacity="0.5"
        strokeWidth="4"
      />
      {/* Keys, near and far */}
      <polygon
        points="470,266 810,266 856,352 424,352"
        fill="url(#sb-key)"
        fillOpacity="0.55"
        stroke="#f6f1e6"
        strokeOpacity="0.42"
        strokeWidth="4"
      />
      <polygon
        points="330,570 950,570 1030,720 250,720"
        fill="url(#sb-key)"
        fillOpacity="0.5"
        stroke="#f6f1e6"
        strokeOpacity="0.4"
        strokeWidth="4"
      />
      {/* No far-end hoop: it lands top-centre, exactly where the bug sits, and
          shows through as a red smear once the bug starts fading out. */}

      <rect width="1280" height="720" fill="url(#sb-light)" />
      <rect
        y="470"
        width="1280"
        height="250"
        fill="#000"
        opacity="0.22"
      />
    </svg>
  </AbsoluteFill>
);

/**
 * The clock runs the whole window and three baskets land at 0.45s, 1.85s and
 * 3.35s, so every one of the audit's samples (frames 18 / 60 / 108 of 120)
 * sits inside a `flashFor` window — the flash is the component's signature
 * beat and it used to decay to zero in the gaps between samples.
 *
 * `holdSeconds={3.28}` puts frame 108 mid-exit: the exit curve is
 * `Easing.in(Easing.cubic)`, so the sample wants `0.9·window/fps − 0.79·exitFor`,
 * not the linear `− exitFor/2`. `scale={1.8}` is framing, not motion — at the
 * default broadcast size the bug covered 4.5% of the tile.
 * See docs-internal/preview-audit-rubric.md.
 */
export const SportsScorebugPreview: React.FC = () => (
  <PreviewFrame lane="blocks" padding={0}>
    <BroadcastBackdrop />
    <SportsScorebug
      away={{ abbr: "NOR", score: 66, color: "#7DD3E8" }}
      home={{ abbr: "VAL", score: 71, color: "#E8B86D", possession: true }}
      period="Q4"
      clockSeconds={154}
      changes={[
        { side: "away", atSeconds: 0.45, points: 3 },
        { side: "home", atSeconds: 1.85, points: 2 },
        { side: "away", atSeconds: 3.35, points: 2 },
      ]}
      scale={1.8}
      holdSeconds={3.28}
    />
  </PreviewFrame>
);
