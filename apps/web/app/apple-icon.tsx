import { ImageResponse } from "next/og";
import { brandMarkDataUrl } from "@/lib/brand-mark-svg";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1f1e1d",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brandMarkDataUrl()} width={128} height={128} alt="" />
      </div>
    ),
    { ...size },
  );
}
