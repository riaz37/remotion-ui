import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { BRAND_COLORS, brandMarkDataUrl } from "@/lib/brand-mark-svg";
import { ATLAS_LANES, REGISTRY_ATLAS, type AtlasLane } from "@/lib/atlas";
import { laneTint } from "@/lib/lane-visuals";
import { source } from "@/lib/source";

/**
 * Per-page docs OG images, served at /og/docs/<...slugs>/image.png
 * (the /docs index is /og/docs/image.png).
 *
 * This can't be an `opengraph-image.tsx` inside app/docs/[[...slug]]: Turbopack
 * panics because a catch-all must be the last path segment. The trailing
 * `image.png` segment follows the fumadocs convention for the same problem.
 */
const IMAGE_SEGMENT = "image.png";
const SIZE = { width: 1200, height: 630 } as const;
const TITLE_MAX = 70;
const DESCRIPTION_MAX = 150;

export const dynamicParams = false;

export function generateStaticParams() {
  return source
    .getPages()
    .map((page) => ({ slug: [...page.slugs, IMAGE_SEGMENT] }));
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function titleFontSize(title: string): number {
  if (title.length > 48) return 60;
  if (title.length > 28) return 72;
  return 88;
}

/** Satori can't paint oklch(), so convert the lane token to sRGB hex. */
function oklchToHex(oklch: string): string | null {
  const match = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(oklch);
  if (!match) return null;
  const [L, C, H] = match.slice(1).map(Number);
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return `#${linear
    .map((channel) => {
      const c = Math.min(1, Math.max(0, channel));
      const gamma = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
      return Math.round(gamma * 255)
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
}

function componentLane(slugs: string[]): AtlasLane | null {
  if (slugs.length !== 2 || slugs[0] !== "components") return null;
  return REGISTRY_ATLAS[slugs[1]]?.lane ?? null;
}

export async function GET(
  _request: Request,
  props: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await props.params;
  if (slug.at(-1) !== IMAGE_SEGMENT) notFound();
  const slugs = slug.slice(0, -1);
  const page = source.getPage(slugs);
  if (!page) notFound();

  const lane = componentLane(slugs);
  const accent =
    (lane ? oklchToHex(laneTint(lane, 1)) : null) ?? BRAND_COLORS.phosphor;
  const title = truncate(page.data.title ?? "Documentation", TITLE_MAX);
  const description = page.data.description
    ? truncate(page.data.description, DESCRIPTION_MAX)
    : null;
  const eyebrow = lane ? ATLAS_LANES[lane].label : "Docs";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: BRAND_COLORS.bg,
          color: BRAND_COLORS.ink,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandMarkDataUrl()} width={56} height={56} alt="" />
          <div
            style={{
              fontSize: 28,
              fontFamily: "Georgia, serif",
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            RemotionUI
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginLeft: 12,
              padding: "8px 18px",
              borderRadius: 999,
              border: `2px solid ${accent}`,
              color: accent,
              fontSize: 22,
              fontFamily: "monospace",
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: accent,
              }}
            />
            {eyebrow}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: titleFontSize(title),
              fontFamily: "Georgia, serif",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                fontSize: 30,
                color: BRAND_COLORS.muted,
                lineHeight: 1.35,
                maxWidth: 960,
              }}
            >
              {description}
            </div>
          ) : null}
        </div>

        <div style={{ fontSize: 22, color: accent, fontFamily: "monospace" }}>
          {truncate(`remotionui.com${page.url}`, 80)}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: accent,
          }}
        />
      </div>
    ),
    { ...SIZE },
  );
}
