"use client";

import type { ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

const route = "M142 350 C260 230 370 430 510 300 C640 178 750 250 842 158";
const points = [
  { x: 142, y: 350, label: "Depot" },
  { x: 510, y: 300, label: "Hub" },
  { x: 842, y: 158, label: "Client" },
];

function MapBase({ children, title }: { children?: ReactNode; title: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 68% 20%, rgba(56,189,248,0.22), transparent 30%), linear-gradient(160deg, #07111f, #0f2d3f 56%, #07111f)",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 960 540"
        style={{ position: "absolute", inset: 0 }}
      >
        <g opacity="0.24" stroke="#93c5fd" strokeWidth="1">
          {Array.from({ length: 9 }).map((_, index) => (
            <path
              key={`lat-${index}`}
              d={`M0 ${90 + index * 44} C240 ${62 + index * 44} 720 ${118 + index * 44} 960 ${90 + index * 44}`}
              fill="none"
            />
          ))}
          {Array.from({ length: 8 }).map((_, index) => (
            <path
              key={`lng-${index}`}
              d={`M${80 + index * 120} 0 C${36 + index * 120} 160 ${124 + index * 120} 360 ${80 + index * 120} 540`}
              fill="none"
            />
          ))}
        </g>
        <path
          d="M0 430 C160 360 300 410 430 340 C590 250 715 310 960 190 L960 540 L0 540 Z"
          fill="#38bdf8"
          opacity="0.12"
        />
        {children}
      </svg>
      <div style={{ position: "absolute", left: 48, top: 40 }}>
        <div style={{ color: "#7dd3fc", fontSize: 24, fontWeight: 800 }}>
          Logistics
        </div>
        <div
          style={{ marginTop: 8, fontSize: 52, lineHeight: 1, fontWeight: 900 }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

export const MapCanvasPreview: React.FC = () => (
  <MapBase title="Regional view">
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
  </MapBase>
);

export const MapRoutePreview: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [8, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
  <MapBase title="Delivery route">
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
    </MapBase>
  );
};

export const MapMarkersPreview: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <MapBase title="Live stops">
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
    </MapBase>
  );
};
