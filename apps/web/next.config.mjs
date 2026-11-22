import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Static export for Cloudflare Pages: every route is a file on the CDN, so
  // traffic costs nothing. Redirects and rewrites live in public/_redirects.
  output: "export",
  images: { unoptimized: true },
  transpilePackages: ["remotion", "@remotion/player"],
};

export default withMDX(config);
