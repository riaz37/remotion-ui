"use client";

import { useMemo, useState } from "react";
import { ComponentCard } from "@/components/component-card";
import { FilmstripScroll } from "@/components/studio/filmstrip-scroll";
import { ATLAS_LANES } from "@/lib/atlas";
import type { ComponentSection } from "@/lib/docs-nav";
import type { AtlasLane } from "@/lib/atlas";

type AtlasBrowseProps = {
  sections: ComponentSection[];
};

export function AtlasBrowse({ sections }: AtlasBrowseProps) {
  const [filter, setFilter] = useState<AtlasLane | "all">("all");

  const visibleSections = useMemo(() => {
    if (filter === "all") return sections;
    return sections.filter((s) => s.lane === filter);
  }, [sections, filter]);

  const lanes = Object.keys(ATLAS_LANES) as AtlasLane[];

  return (
    <section className="not-prose mx-auto w-full max-w-[1120px] pb-20 pt-6">
      <div className="mb-10 flex flex-wrap gap-4 border-b border-[var(--bay-border)] pb-4">
        <FilterTab
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
        />
        {lanes.map((lane) => (
          <FilterTab
            key={lane}
            active={filter === lane}
            onClick={() => setFilter(lane)}
            label={ATLAS_LANES[lane].label}
          />
        ))}
      </div>

      {visibleSections.map((section) => (
        <div key={section.title} className="mb-14 last:mb-0">
          <div className="mb-5">
            <h3 className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight">
              {section.title}
            </h3>
            {section.lane ? (
              <p className="mt-1 text-sm text-fd-muted-foreground">
                {ATLAS_LANES[section.lane].description} ·{" "}
                {section.items.length} components
              </p>
            ) : null}
          </div>
          <FilmstripScroll>
            {section.items.map((item) => (
              <ComponentCard
                key={item.slug}
                name={item.name}
                slug={item.slug}
                url={item.url}
                description={item.description}
                lane={item.lane}
                className="w-[240px] shrink-0 snap-start"
              />
            ))}
          </FilmstripScroll>
        </div>
      ))}
    </section>
  );
}

function FilterTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm font-medium transition-colors ${
        active
          ? "text-[var(--bay-phosphor)] underline underline-offset-4"
          : "text-fd-muted-foreground hover:text-fd-foreground"
      }`}
    >
      {label}
    </button>
  );
}
