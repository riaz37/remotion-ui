import { ImageResponse } from "next/og";
import { BRAND_COLORS, brandMarkDataUrl } from "@/lib/brand-mark-svg";
import { getBlogPost, getBlogPosts } from "@/lib/blog";

export const alt = "RemotionUI blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }));
}

export default async function BlogOpenGraphImage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const post = getBlogPost(slug);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
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
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: post && post.title.length > 48 ? 62 : 76,
              fontFamily: "Georgia, serif",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              maxWidth: 1000,
            }}
          >
            {post?.title ?? "RemotionUI blog"}
          </div>
          {post?.description ? (
            <div
              style={{
                fontSize: 30,
                color: BRAND_COLORS.muted,
                lineHeight: 1.3,
                maxWidth: 900,
              }}
            >
              {post.description.length > 130
                ? `${post.description.slice(0, 130).trimEnd()}…`
                : post.description}
            </div>
          ) : null}
        </div>

        <div
          style={{
            fontSize: 22,
            color: BRAND_COLORS.phosphor,
            fontFamily: "monospace",
          }}
        >
          remotionui.com/blog
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
