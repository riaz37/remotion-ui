"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ComponentCard } from "@/components/component-card";
import { ATLAS_LANES } from "@/lib/atlas";
import type { ComponentSection } from "@/lib/docs-nav";
import { laneAccent } from "@/lib/lane-visuals";
import type { AtlasLane } from "@/lib/atlas";

type AtlasBrowseProps = {
  sections: ComponentSection[];
  totalComponents: number;
};

export function AtlasBrowse({ sections, totalComponents }: AtlasBrowseProps) {
  const [filter, setFilter] = useState<AtlasLane | "all">("all");

  const visibleSections = useMemo(() => {
    if (filter === "all") return sections;
    return sections.filter((s) => s.lane === filter);
  }, [sections, filter]);

  const lanes = Object.keys(ATLAS_LANES) as AtlasLane[];

  return (
    <section className="not-prose mx-auto w-full max-w-6xl pb-20 pt-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
            Component Atlas
          </h2>
          <p className="mt-1 text-sm text-fd-muted-foreground">
            Browse by motion role: {totalComponents} components
          </p>
        </div>
        <Link
          href="/docs/atlas"
          className="text-sm font-medium text-fd-primary transition-opacity hover:opacity-80"
        >
          Atlas guide →
        </Link>
      </div>

      <div className="mb-10 flex flex-wrap gap-2">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
        />
        {lanes.map((lane) => (
          <FilterChip
            key={lane}
            active={filter === lane}
            onClick={() => setFilter(lane)}
            label={ATLAS_LANES[lane].label}
            accent={laneAccent(lane)}
          />
        ))}
      </div>

      {visibleSections.map((section) => (
        <div key={section.title} className="mb-14 last:mb-0">
          <div className="mb-5">
            <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
              {section.title}
            </h3>
            <p className="mt-1 text-sm text-fd-muted-foreground">
              {ATLAS_LANES[section.lane!].description} ·{" "}
              {section.items.length} components
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <ComponentCard
                key={item.slug}
                name={item.name}
                slug={item.slug}
                url={item.url}
                description={item.description}
                lane={item.lane}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  accent,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-fd-primary bg-fd-primary/10 text-fd-primary"
          : "border-fd-border text-fd-muted-foreground hover:border-fd-primary/40 hover:text-fd-foreground"
      }`}
      style={active && accent ? { borderColor: accent, color: accent } : undefined}
    >
      {label}
    </button>
  );
}
