import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { BRAND_BG } from "@/lib/brand-tokens";

export const previewTextStyle: React.CSSProperties = {
  color: "white",
  fontSize: 48,
  fontFamily: "system-ui, sans-serif",
  textAlign: "center",
};

/** Full-frame scene root — primitives wrap only the label, not AbsoluteFill. */
export const PreviewFrame: React.FC<{
  children: ReactNode;
  backgroundColor?: string;
}> = ({ children, backgroundColor = BRAND_BG }) => (
  <AbsoluteFill
    style={{
      backgroundColor,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    {children}
  </AbsoluteFill>
);

export const PreviewLabel: React.FC<{ children: ReactNode }> = ({
  children,
}) => <div style={previewTextStyle}>{children}</div>;
