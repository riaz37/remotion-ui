"use client";

import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { MapPreviewBase } from "./map-preview-base";

const FLIGHT_PATH = "M 248 302 Q 500 72 712 268";
const PATH_LENGTH = 620;

const from = { x: 248, y: 302, label: "Zurich" };
const to = { x: 712, y: 268, label: "New York" };

function pointOnQuadratic(
  t: number,
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
) {
  const mt = 1 - t;
  return {
    x: mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
    y: mt * mt * y0 + 2 * mt * t * cy + t * t * y1,
  };
}

/**
 * Docs-safe map flight preview — no WebGL/MapLibre (tiles fail in embedded players).
 * Timing and motion match the installed MapFlight scene.
 */
export const MapFlightDocsPreview: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const timelineProgress = interpolate(
    frame,
    [0, durationInFrames - 1],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const routeProgress = interpolate(timelineProgress, [0.2, 0.82], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const cameraScale = interpolate(
    timelineProgress,
    [0, 0.28, 0.74, 1],
    [1, 0.78, 0.78, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );

  const cameraY = interpolate(
    timelineProgress,
    [0, 0.28, 0.74, 1],
    [0, 28, 28, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );

  const traveler = pointOnQuadratic(routeProgress, 248, 302, 500, 72, 712, 268);

  return (
    <MapPreviewBase subtitle="Spatial" title="Global flyover">
      <g
        transform={`translate(480 ${270 + cameraY}) scale(${cameraScale}) translate(-480 -270)`}
      >
        <path
          d={FLIGHT_PATH}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={FLIGHT_PATH}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={PATH_LENGTH}
          strokeDashoffset={PATH_LENGTH * (1 - routeProgress)}
        />
        <circle
          cx={traveler.x}
          cy={traveler.y}
          r="9"
          fill="#f8fafc"
          stroke="#f59e0b"
          strokeWidth="4"
        />
        {[from, to].map((marker, index) => {
          const reveal = interpolate(
            timelineProgress,
            index === 0 ? [0, 0.12] : [0.78, 0.94],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            },
          );
          const labelOnLeft = index === 0;

          return (
            <g
              key={marker.label}
              opacity={reveal}
              transform={`translate(${marker.x} ${marker.y}) scale(${0.86 + reveal * 0.14})`}
            >
              <circle r="16" fill="#f59e0b" />
              <circle
                r="30"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3"
                opacity="0.35"
              />
              <rect
                x={labelOnLeft ? -148 : 24}
                y="-22"
                width="124"
                height="44"
                rx="12"
                fill="rgba(2,6,23,0.82)"
                stroke="rgba(255,255,255,0.16)"
              />
              <text
                x={labelOnLeft ? -118 : 54}
                y="6"
                fill="#f8fafc"
                fontSize="18"
                fontFamily="system-ui"
                fontWeight="800"
              >
                {marker.label}
              </text>
            </g>
          );
        })}
      </g>
    </MapPreviewBase>
  );
};
