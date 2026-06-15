import type { ReactNode } from "react";
import { StudioPanel } from "./studio/studio-panel";

export function PreviewPanel({
  title = "composition",
  aspectRatio = "16 / 9",
  fps = 30,
  width,
  height,
  durationInFrames,
  children,
}: {
  title?: string;
  aspectRatio?: string;
  fps?: number;
  width?: number;
  height?: number;
  durationInFrames?: number;
  children: ReactNode;
}) {
  return (
    <StudioPanel
      label={title}
      aspectRatio={aspectRatio}
      fps={fps}
      width={width}
      height={height}
      durationInFrames={durationInFrames}
    >
      {children}
    </StudioPanel>
  );
}
