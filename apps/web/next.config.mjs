import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ["remotion", "@remotion/player"],
  async redirects() {
    return [
      {
        source: "/docs/ai/recipes/:slug*",
        destination: "/docs/recipes/:slug*",
        permanent: true,
      },
    ];
  },
};

export default withMDX(config);
