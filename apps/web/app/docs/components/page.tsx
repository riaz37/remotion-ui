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

const title = "Remotion Components — Live Preview Catalog";
const description =
  "Browse and install production-ready Remotion components with live previews. Primitives, scenes, and compositions via the RemotionUI CLI.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Remotion components",
    "Remotion component library",
    "Remotion compositions",
    "RemotionUI registry",
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
      <div className="not-prose -mx-4 border-b border-fd-border px-4 pb-10 md:-mx-6 md:px-6 xl:-mx-8 xl:px-8">
        <DocsTitle className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Remotion Components
        </DocsTitle>
        <DocsDescription className="mt-3 max-w-2xl text-base">
          Browse {totalComponents} production-ready components with live
          previews. Filter by motion role, then install with{" "}
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
