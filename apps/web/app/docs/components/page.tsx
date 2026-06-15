import {
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import { AtlasBrowse } from "@/components/atlas-browse";
import { getAtlasSections } from "@/lib/docs-nav";
import { componentsItemListJsonLd } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site-config";

const title = "Storyboard — Remotion component catalog";
const description =
  "Browse and install Remotion compositions with live previews. Scrub clips, install source with the CLI.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Remotion components",
    "Remotion compositions",
    "RemotionUI registry",
    "Remotion storyboard",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${siteConfig.url}/docs/components`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${siteConfig.url}/docs/components`,
  },
};

export default function ComponentsPage() {
  const sections = getAtlasSections();
  const totalComponents = sections.reduce(
    (count, section) => count + section.items.length,
    0,
  );
  const itemListJsonLd = componentsItemListJsonLd();

  return (
    <DocsPage full breadcrumb={{ enabled: false }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <div className="not-prose -mx-4 border-b border-[var(--bay-border)] px-4 pb-10 md:-mx-6 md:px-6 xl:-mx-8 xl:px-8">
        <DocsTitle className="text-display-lg font-medium tracking-tight">
          Storyboard
        </DocsTitle>
        <DocsDescription className="mt-3 max-w-xl text-[0.9375rem]">
          {totalComponents} compositions, scenes, and primitives — scrub before
          you install with{" "}
          <code className="font-[family-name:var(--font-mono)] text-sm">
            npx remotion-ui add
          </code>
          .
        </DocsDescription>
      </div>
      <AtlasBrowse sections={sections} totalComponents={totalComponents} />
    </DocsPage>
  );
}
