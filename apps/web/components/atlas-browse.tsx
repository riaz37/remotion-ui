"use client";

import { useEffect, useMemo, useState } from "react";
import { ComponentCard } from "@/components/component-card";
import { FilmstripScroll } from "@/components/studio/filmstrip-scroll";
import { ATLAS_LANES, getAtlasMeta, REGISTRY_ATLAS, TAG_GROUPS } from "@/lib/atlas";
import type { ComponentSection } from "@/lib/docs-nav";
import type { AtlasLane } from "@/lib/atlas";

type AtlasBrowseProps = {
  sections: ComponentSection[];
};

export function AtlasBrowse({ sections }: AtlasBrowseProps) {
  const [filter, setFilter] = useState<AtlasLane | "all">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  useEffect(() => {
    setTagFilter(null);
  }, [filter]);

  const tagChips = useMemo(() => {
    if (filter === "all") return [];
    const laneSlugs = Object.entries(REGISTRY_ATLAS)
      .filter(([, meta]) => meta.lane === filter)
      .map(([name]) => name);

    return TAG_GROUPS[filter]
      .map((group) => {
        const count = laneSlugs.filter((slug) =>
          REGISTRY_ATLAS[slug]?.tags?.includes(group.tag),
        ).length;
        const min = group.minItems ?? 3;
        if (count < min) return null;
        return { tag: group.tag, label: group.label, count };
      })
      .filter((chip): chip is { tag: string; label: string; count: number } =>
        chip !== null,
      );
  }, [filter]);

  const visibleSections = useMemo(() => {
    let next =
      filter === "all"
        ? sections
        : sections.filter((section) => section.lane === filter);

    if (tagFilter && filter !== "all") {
      next = next
        .map((section) => ({
          ...section,
          items: section.items.filter((item) =>
            getAtlasMeta(item.slug)?.tags?.includes(tagFilter),
          ),
        }))
        .filter((section) => section.items.length > 0);
    }

    return next;
  }, [sections, filter, tagFilter]);

  const lanes = Object.keys(ATLAS_LANES) as AtlasLane[];

  return (
    <section className="not-prose mx-auto w-full max-w-[1120px] pb-20 pt-6">
      <div className="mb-6 flex flex-wrap gap-4 border-b border-[var(--bay-border)] pb-4">
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

      {tagChips.length > 0 ? (
        <div className="mb-8 flex flex-wrap gap-2">
          <TagChip
            active={tagFilter === null}
            onClick={() => setTagFilter(null)}
            label="All in lane"
          />
          {tagChips.map((chip) => (
            <TagChip
              key={chip.tag}
              active={tagFilter === chip.tag}
              onClick={() =>
                setTagFilter(tagFilter === chip.tag ? null : chip.tag)
              }
              label={`${chip.label} (${chip.count})`}
            />
          ))}
        </div>
      ) : null}

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

function TagChip({
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
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-[var(--bay-phosphor)] bg-[var(--bay-phosphor)]/10 text-[var(--bay-phosphor)]"
          : "border-[var(--bay-border)] text-fd-muted-foreground hover:border-[var(--bay-border-strong)] hover:text-fd-foreground"
      }`}
    >
      {label}
    </button>
  );
}
