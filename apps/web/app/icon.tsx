import { ImageResponse } from "next/og";
import { brandMarkDataUrl } from "@/lib/brand-mark-svg";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={brandMarkDataUrl()} width={32} height={32} alt="" />
    ),
    { ...size },
  );
}
