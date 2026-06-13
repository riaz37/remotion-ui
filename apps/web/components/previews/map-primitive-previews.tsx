"use client";

import type { ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { MapPreviewBase } from "./map-preview-base";

const route = "M142 350 C260 230 370 430 510 300 C640 178 750 250 842 158";
const points = [
  { x: 142, y: 350, label: "Depot" },
  { x: 510, y: 300, label: "Hub" },
  { x: 842, y: 158, label: "Client" },
];

export const MapCanvasPreview: React.FC = () => (
  <MapPreviewBase title="Regional view">
    <rect
      x="650"
      y="330"
      width="180"
      height="78"
      rx="18"
      fill="rgba(15,23,42,0.72)"
      stroke="rgba(125,211,252,0.5)"
    />
    <text
      x="675"
      y="378"
      fill="#e0f2fe"
      fontSize="24"
      fontFamily="system-ui"
      fontWeight="800"
    >
      tile-free
    </text>
  </MapPreviewBase>
);

export const MapRoutePreview: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [8, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <MapPreviewBase title="Delivery route">
      <path
        d={route}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d={route}
        fill="none"
        stroke="#f59e0b"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="980"
        strokeDashoffset={(1 - progress) * 980}
      />
    </MapPreviewBase>
  );
};

export const MapMarkersPreview: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <MapPreviewBase title="Live stops">
      {points.map((point, index) => {
        const progress = interpolate(
          frame,
          [index * 10 + 8, index * 10 + 28],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          },
        );
        return (
          <g
            key={point.label}
            opacity={progress}
            transform={`translate(${point.x} ${point.y}) scale(${0.8 + progress * 0.2})`}
          >
            <circle r="18" fill="#f59e0b" />
            <circle
              r="34"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="4"
              opacity="0.35"
            />
            <rect
              x="28"
              y="-24"
              width="112"
              height="48"
              rx="14"
              fill="rgba(2,6,23,0.82)"
              stroke="rgba(255,255,255,0.16)"
            />
            <text
              x="46"
              y="7"
              fill="#f8fafc"
              fontSize="20"
              fontFamily="system-ui"
              fontWeight="800"
            >
              {point.label}
            </text>
          </g>
        );
      })}
    </MapPreviewBase>
  );
};
