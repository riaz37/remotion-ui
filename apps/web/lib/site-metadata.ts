import { siteConfig } from "@/lib/site-config";

export const siteMetadata = {
  title: "RemotionUI – Production-ready motion for Remotion",
  description: `${siteConfig.tagline} Registry + CLI for primitives, scenes, and compositions — captions, charts, social clips, and more.`,
  keywords: [
    "Remotion",
    "Remotion components",
    "programmatic video",
    "React video",
    "motion graphics",
    "motion registry",
    "video CLI",
    "source-owned components",
  ],
  ogImage: "/og.png",
  twitterHandle: "@riaz_exorous",
} as const;

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    description: siteMetadata.description,
    url: siteConfig.url,
    downloadUrl: siteConfig.npmUrl,
    softwareHelp: `${siteConfig.url}/docs`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}
