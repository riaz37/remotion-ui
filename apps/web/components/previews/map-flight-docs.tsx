"use client";

import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Docs-safe map flight preview — no WebGL/MapLibre (tiles often fail in embedded players).
 * Mirrors the route-reveal + flyover feel for visual QA.
 */
export const MapFlightDocsPreview: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const routeProgress = interpolate(progress, [0.15, 0.85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pathLength = 420;
  const dashOffset = pathLength * (1 - routeProgress);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0c4a6e 0%, #0f172a 55%, #020617 100%)",
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <radialGradient id="oceanGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill="url(#oceanGlow)" />
        {/* Simplified continents */}
        <ellipse cx={width * 0.28} cy={height * 0.42} rx={width * 0.14} ry={height * 0.18} fill="#1e293b" opacity={0.9} />
        <ellipse cx={width * 0.72} cy={height * 0.38} rx={width * 0.16} ry={height * 0.2} fill="#1e293b" opacity={0.9} />
        {/* Flight arc */}
        <path
          d={`M ${width * 0.22} ${height * 0.52} Q ${width * 0.5} ${height * 0.18} ${width * 0.78} ${height * 0.45}`}
          fill="none"
          stroke="#f97316"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={dashOffset}
        />
        {/* Markers */}
        <circle cx={width * 0.22} cy={height * 0.52} r={10} fill="#f97316" stroke="#fff" strokeWidth={3} />
        <circle cx={width * 0.78} cy={height * 0.45} r={10} fill="#f97316" stroke="#fff" strokeWidth={3} />
        <text x={width * 0.22} y={height * 0.52 + 28} fill="#f8fafc" fontSize={18} fontFamily="system-ui" textAnchor="middle">
          Zurich
        </text>
        <text x={width * 0.78} y={height * 0.45 + 28} fill="#f8fafc" fontSize={18} fontFamily="system-ui" textAnchor="middle">
          New York
        </text>
      </svg>
    </AbsoluteFill>
  );
};
