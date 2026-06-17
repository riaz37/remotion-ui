"use client";

import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img } from "remotion";
import { SCENE_PREVIEW_GRADIENT } from "@/lib/demo-assets";

type ScenePreviewPlateProps = {
  children: ReactNode;
  /** Optional full-bleed media behind the gradient plate */
  mediaSrc?: string;
  /** When true, only render children (scene owns the full frame) */
  direct?: boolean;
  style?: CSSProperties;
};

/**
 * Docs preview stage for registry scenes.
 * - `direct`: scene paints its own background (title-card, charts, etc.)
 * - default plate: gradient backdrop for transparent overlays (lower-third, captions)
 * - `mediaSrc`: demo still under the plate for overlay scenes
 */
export function ScenePreviewPlate({
  children,
  mediaSrc,
  direct = false,
  style,
}: ScenePreviewPlateProps) {
  if (direct) {
    return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
  }

  return (
    <AbsoluteFill style={style}>
      {mediaSrc ? (
        <Img
          src={mediaSrc}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          background: mediaSrc
            ? "linear-gradient(to bottom, rgba(5,5,16,0.35) 0%, rgba(8,8,16,0.72) 100%)"
            : SCENE_PREVIEW_GRADIENT,
        }}
      />
      {children}
    </AbsoluteFill>
  );
}
