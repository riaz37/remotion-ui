import type { MetadataRoute } from "next";
import { source } from "@/lib/source";
import { siteConfig } from "@/lib/site-config";

const now = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const docsPages = source.getPages().map((page) => ({
    url: `${siteConfig.url}${page.url}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: page.url === "/docs" ? 0.9 : 0.7,
  }));

  return [
    {
      url: siteConfig.url,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...docsPages,
  ];
}
