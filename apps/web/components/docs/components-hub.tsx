import { AtlasBrowse } from "@/components/atlas-browse";
import { ATLAS_LANES } from "@/lib/atlas";
import { getAtlasSections } from "@/lib/docs-nav";
import { componentsItemListJsonLd } from "@/lib/site-metadata";

export function ComponentsHub() {
  const sections = getAtlasSections();
  const totalComponents = sections.reduce(
    (count, section) => count + section.items.length,
    0,
  );
  const itemListJsonLd = componentsItemListJsonLd();
  const laneSummary = Object.values(ATLAS_LANES)
    .map((lane) => `${lane.label} (${lane.description.toLowerCase()})`)
    .join("; ");

  return (
    <div className="not-prose space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <p className="text-sm leading-relaxed text-fd-muted-foreground">
        {totalComponents} installable components grouped by motion role:{" "}
        {laneSummary}. Use lane filters below or jump to any item from the
        sidebar.
      </p>
      <AtlasBrowse sections={sections} />
    </div>
  );
}
