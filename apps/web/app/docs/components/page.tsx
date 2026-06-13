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
    <div className="not-prose -mx-4 -mt-6">
      <div className="border-b border-fd-border px-6 py-10">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Components
        </h1>
        <p className="mt-3 max-w-2xl text-fd-muted-foreground">
          Browse {totalComponents} production-ready components with live previews.
          Filter by motion role, then install with{" "}
          <code className="font-[family-name:var(--font-mono)] text-sm">
            npx remotion-ui add
          </code>
          .
        </p>
      </div>
      <AtlasBrowse sections={sections} totalComponents={totalComponents} />
    </div>
  );
}
