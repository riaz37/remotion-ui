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
  // The llms routes read raw MDX from disk (`getText("raw")`). File tracing
  // can't see those reads, so without this the function ships without the
  // docs and fails with ENOENT on any request that misses the static cache.
  outputFileTracingIncludes: {
    "/llms.mdx/**": ["./content/docs/**/*"],
  },
  async rewrites() {
    // beforeFiles: the generated public/llms*.txt would otherwise shadow the routes.
    return {
      beforeFiles: [
        { source: "/llms.txt", destination: "/llms.mdx/llms.txt" },
        { source: "/llms-full.txt", destination: "/llms.mdx/llms-full.txt" },
        { source: "/docs.md", destination: "/llms.mdx/docs" },
        { source: "/docs/:path(.+)\\.md", destination: "/llms.mdx/docs/:path" },
      ],
    };
  },
  async redirects() {
    return [
      // Kine early access was retired; its old addresses are still linked.
      {
        source: "/:page(kine|cutaway|early-access)",
        destination: "/",
        permanent: false,
      },
      {
        source: "/docs/ai/recipes/:slug*",
        destination: "/docs/components/browse",
        permanent: true,
      },
      {
        source: "/docs/ai/start",
        destination: "/docs/ai",
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
        source: "/docs/recipes/:slug*",
        destination: "/docs/components/browse",
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
