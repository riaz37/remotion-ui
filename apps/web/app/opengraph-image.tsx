import { ImageResponse } from "next/og";
import { BRAND_COLORS, brandMarkDataUrl } from "@/lib/brand-mark-svg";

export const alt =
  "RemotionUI — Production-ready motion for Remotion";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: BRAND_COLORS.bg,
          color: BRAND_COLORS.ink,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 48,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandMarkDataUrl()} width={128} height={128} alt="" />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 88,
                fontFamily: "Georgia, serif",
                fontWeight: 500,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              RemotionUI
            </div>
            <div
              style={{
                fontSize: 36,
                color: BRAND_COLORS.muted,
                lineHeight: 1.2,
                maxWidth: 720,
              }}
            >
              Production-ready motion for Remotion.
            </div>
            <div
              style={{
                fontSize: 22,
                color: BRAND_COLORS.phosphor,
                fontFamily: "monospace",
              }}
            >
              remotion-ui · source you own
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: BRAND_COLORS.phosphor,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
