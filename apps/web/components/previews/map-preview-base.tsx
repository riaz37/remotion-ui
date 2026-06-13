"use client";

import type { ReactNode } from "react";

type MapPreviewBaseProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

/** Shared stylized map stage for docs previews (no MapLibre tiles). */
export function MapPreviewBase({
  title,
  subtitle,
  children,
}: MapPreviewBaseProps) {
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
        <ellipse
          cx="250"
          cy="300"
          rx="118"
          ry="88"
          fill="#164e63"
          opacity="0.55"
        />
        <ellipse
          cx="700"
          cy="270"
          rx="132"
          ry="96"
          fill="#164e63"
          opacity="0.55"
        />
        {children}
      </svg>
      <div style={{ position: "absolute", left: 48, top: 40 }}>
        {subtitle ? (
          <div style={{ color: "#7dd3fc", fontSize: 24, fontWeight: 800 }}>
            {subtitle}
          </div>
        ) : null}
        <div
          style={{
            marginTop: subtitle ? 8 : 0,
            fontSize: 52,
            lineHeight: 1,
            fontWeight: 900,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}
