import { siteConfig } from "@/lib/site-config";

export const siteMetadata = {
  title: "RemotionUI – Production-ready motion for Remotion",
  description: `${siteConfig.tagline} ${siteConfig.description}`,
  keywords: [
    "Remotion",
    "Remotion components",
    "Remotion component library",
    "Remotion captions",
    "shadcn for Remotion",
    "Remotion compositions",
    "Remotion social clip",
    "Remotion CLI",
    "programmatic video",
    "React video",
    "motion graphics",
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

const FLAGSHIP_COMPOSITION_URLS = [
  "/docs/components/social-clip",
  "/docs/components/creator-reel",
  "/docs/components/podcast-clip",
  "/docs/components/data-story",
  "/docs/components/intro",
  "/docs/components/showcase",
  "/docs/components/tutorial-clip",
  "/docs/components/hero-loop",
  "/docs/components/lower-third",
  "/docs/components/caption-highlight",
] as const;

export function componentsItemListJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "RemotionUI Components",
    description:
      "Production-ready Remotion primitives, scenes, and compositions.",
    numberOfItems: FLAGSHIP_COMPOSITION_URLS.length,
    itemListElement: FLAGSHIP_COMPOSITION_URLS.map((path, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteConfig.url}${path}`,
    })),
  };
}

type FaqEntry = { question: string; answer: string };

export function faqPageJsonLd(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}

export const docsFaqJsonLdBySlug: Record<string, FaqEntry[]> = {
  index: [
    {
      question: "Is RemotionUI a shadcn registry namespace?",
      answer:
        "RemotionUI uses a compatible registry schema but ships its own remotion-ui CLI tuned for Remotion project layout and composition registration.",
    },
    {
      question: "Can I use npx shadcn add with RemotionUI?",
      answer:
        "Use npx remotion-ui add. It resolves dependencies, patches Root.tsx for compositions, and respects remotion-ui.json paths.",
    },
    {
      question: "Is the installed source MIT licensed?",
      answer:
        "Yes. Installed components are yours to modify and ship in your videos.",
    },
  ],
  "advanced/captions": [
    {
      question: "How do I get TikTok-style captions in Remotion?",
      answer:
        "Use CaptionScene with mode karaoke-scale, or install the social-clip composition which wires captions, audiogram, and CTA for 9:16 output.",
    },
    {
      question: "Do I need a runtime dependency on RemotionUI?",
      answer:
        "No. After running remotion-ui add, you own the source files. Only the CLI is published to npm.",
    },
    {
      question: "Can I customize timing per word?",
      answer:
        "Yes. Captions use Remotion Caption objects with startMs and endMs. Edit the JSON or regenerate from your transcript.",
    },
  ],
};
