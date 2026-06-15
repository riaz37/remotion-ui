import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

const legacyComponentSections = [
  "primitives",
  "signals",
  "vectors",
  "spatial",
  "cuts",
  "scenes",
  "compositions",
  "utilities",
];

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ["remotion", "@remotion/player"],
  async redirects() {
    return [
      {
        source: "/docs/ai/recipes",
        destination: "/docs/recipes/browse",
        permanent: true,
      },
      {
        source: "/docs/ai/recipes/:slug*",
        destination: "/docs/recipes/:slug*",
        permanent: true,
      },
      {
        source: "/docs/atlas",
        destination: "/docs/components/browse",
        permanent: true,
      },
      {
        source: "/docs/atlas/:path*",
        destination: "/docs/components/browse",
        permanent: true,
      },
      {
        source: "/docs/components",
        destination: "/docs/components/browse",
        permanent: true,
      },
      {
        source: "/docs/recipes",
        destination: "/docs/recipes/browse",
        permanent: true,
      },
      {
        source: "/docs/advanced/:slug*",
        destination: "/docs/guides/:slug*",
        permanent: true,
      },
      ...legacyComponentSections.map((section) => ({
        source: `/docs/${section}/:slug*`,
        destination: "/docs/components/:slug*",
        permanent: true,
      })),
    ];
  },
};

export default withMDX(config);
