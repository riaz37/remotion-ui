import {
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { AtlasBrowse } from "@/components/atlas-browse";
import { getAtlasSections } from "@/lib/docs-nav";

export const metadata = {
  title: "Components",
  description:
    "Browse RemotionUI compositions, scenes, and primitives with live autoplay previews.",
};

export default function ComponentsPage() {
  const sections = getAtlasSections();
  const totalComponents = sections.reduce(
    (count, section) => count + section.items.length,
    0,
  );

  return (
    <DocsPage full breadcrumb={{ enabled: false }}>
      <div className="not-prose -mx-4 border-b border-fd-border px-4 pb-10 md:-mx-6 md:px-6 xl:-mx-8 xl:px-8">
        <DocsTitle className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Components
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
