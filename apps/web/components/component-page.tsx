import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ATLAS_LANES, getAtlasMeta } from "@/lib/atlas";
import { getComponentDocPath } from "@/lib/component-doc-path";
import { getComponentReference } from "@/lib/component-reference";
import { hasCompositionPlayground } from "@/lib/composition-playground";
import { laneAccent } from "@/lib/lane-visuals";
import { CompositionPlaygroundSection } from "./composition-playground-section";
import { InstallCommand } from "./install-command";
import { PreviewPanel } from "./preview-panel";
import { PropsTable } from "./props-table";
import { RemotionPreview } from "./remotion-preview";

const categoryLabels = {
  primitive: "Primitive",
  scene: "Scene",
  composition: "Composition",
  utility: "Utility",
} as const;

type ComponentPageProps = {
  name: string;
  preview?: ComponentType<Record<string, unknown>>;
  durationInFrames?: number;
  previewWidth?: number;
  previewHeight?: number;
  inputProps?: Record<string, unknown>;
  children?: ReactNode;
};

export function ComponentPage({
  name,
  preview,
  durationInFrames = 90,
  previewWidth = 960,
  previewHeight = 540,
  inputProps,
  children,
}: ComponentPageProps) {
  const previewAspect = `${previewWidth} / ${previewHeight}`;
  const isPortrait = previewHeight > previewWidth;
  const reference = getComponentReference(name);
  const atlas = getAtlasMeta(name);

  const metaParts = [
    reference
      ? { key: "category", label: categoryLabels[reference.category] }
      : null,
    atlas?.lane
      ? {
          key: "lane",
          label: ATLAS_LANES[atlas.lane].label,
          lane: atlas.lane,
        }
      : null,
    atlas?.tier === "advanced"
      ? { key: "tier", label: "Advanced" }
      : null,
  ].filter((part): part is NonNullable<typeof part> => Boolean(part));

  const previewNode = preview ? (
    <PreviewPanel aspectRatio={previewAspect}>
      <RemotionPreview
        component={preview}
        durationInFrames={durationInFrames}
        width={previewWidth}
        height={previewHeight}
        inputProps={inputProps}
      />
    </PreviewPanel>
  ) : null;

  const playgroundNode = hasCompositionPlayground(name) ? (
    <CompositionPlaygroundSection name={name} />
  ) : null;

  return (
    <>
      {metaParts.length > 0 ? (
        <p className="not-prose mb-6 text-sm text-fd-muted-foreground">
          {metaParts.map((part, i) => (
            <span key={part.key}>
              {i > 0 ? (
                <span className="mx-2 text-fd-border" aria-hidden>
                  ·
                </span>
              ) : null}
              <span
                className={part.key === "tier" ? "text-fd-primary" : ""}
                style={
                  part.key === "lane" && part.lane
                    ? { color: laneAccent(part.lane) }
                    : undefined
                }
              >
                {part.label}
              </span>
            </span>
          ))}
        </p>
      ) : null}

      {playgroundNode ? (
        <div className="not-prose mb-8 space-y-6">
          <InstallCommand name={name} />
          {playgroundNode}
          {children ? (
            <div className="text-fd-muted-foreground">{children}</div>
          ) : null}
        </div>
      ) : preview ? (
        <div className="not-prose mb-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] lg:items-start lg:gap-8">
          <div className="min-w-0 space-y-6 lg:order-1">
            <InstallCommand name={name} />
            {children ? (
              <div className="text-fd-muted-foreground">{children}</div>
            ) : null}
          </div>
          <div
            className={`mb-8 lg:sticky lg:top-20 lg:order-2 lg:mb-0 ${
              isPortrait ? "w-72 max-w-full lg:justify-self-end" : ""
            }`}
          >
            {previewNode}
          </div>
        </div>
      ) : (
        <>
          <InstallCommand name={name} />
          {children ? (
            <div className="text-fd-muted-foreground">{children}</div>
          ) : null}
        </>
      )}

      {reference?.note ? (
        <blockquote className="my-6 border-l-2 border-fd-primary pl-4 text-sm text-fd-muted-foreground">
          {reference.note}
        </blockquote>
      ) : null}

      {reference ? (
        <>
          <div className="not-prose my-8 rounded-2xl border border-fd-border bg-fd-card/70 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                  AI usage
                </h2>
                <p className="mt-1 text-sm text-fd-muted-foreground">
                  Install first, then import the copied source component locally.
                </p>
              </div>
              <Link
                href="/docs/ai"
                className="rounded-lg border border-fd-border px-3 py-1.5 text-sm transition-colors hover:bg-fd-muted"
              >
                AI guide
              </Link>
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-xl border border-fd-border bg-fd-muted/30 p-3">
                <p className="mb-2 font-medium">Install</p>
                <code className="font-[family-name:var(--font-mono)] text-xs text-fd-muted-foreground">
                  npx remotion-ui@latest add {name}
                </code>
              </div>
              <div className="rounded-xl border border-fd-border bg-fd-muted/30 p-3">
                <p className="mb-2 font-medium">Import after install</p>
                <code className="font-[family-name:var(--font-mono)] text-xs text-fd-muted-foreground">
                  {getAiImportPath(name)}
                </code>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-fd-muted-foreground">
              <li>Use when: {getAiUseCase(name, reference.category, atlas?.lane)}.</li>
              <li>
                Customize: {getAiCustomizationKnobs(reference.props)}.
              </li>
              <li>
                Rule: do not import this component from the{" "}
                <code className="font-[family-name:var(--font-mono)]">
                  remotion-ui
                </code>{" "}
                npm package; it is copied into your project.
              </li>
            </ul>
          </div>

          <h2 className="mt-10 scroll-m-20 text-xl font-semibold tracking-tight">
            Usage
          </h2>
          <pre className="overflow-x-auto rounded-xl border border-fd-border bg-fd-muted/40 p-4 text-sm">
            <code className="font-[family-name:var(--font-mono)] leading-relaxed">
              {reference.usage}
            </code>
          </pre>

          <h2 className="mt-10 scroll-m-20 text-xl font-semibold tracking-tight">
            API Reference
          </h2>
          <PropsTable props={reference.props} />

          {reference.related && reference.related.length > 0 ? (
            <>
              <h2 className="mt-10 scroll-m-20 text-xl font-semibold tracking-tight">
                Related
              </h2>
              <div className="not-prose flex flex-wrap gap-2">
                {reference.related.map((slug) => (
                  <Link
                    key={slug}
                    href={getComponentDocPath(slug)}
                    className="rounded-lg border border-fd-border px-3 py-1.5 text-sm transition-colors hover:bg-fd-muted"
                  >
                    {slug}
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </>
  );
}

function getAiImportPath(slug: string): string {
  const ref = getComponentReference(slug);
  const atlas = getAtlasMeta(slug);
  if (atlas?.lane === "reels" || ref?.category === "composition") {
    return `@/compositions/${slug}`;
  }
  if (ref?.category === "scene") {
    return `@/remotion/scenes/${slug}`;
  }
  if (ref?.category === "utility") {
    return `@/remotion/lib/${slug}`;
  }
  return `@/remotion/primitives/${slug}`;
}

function getAiUseCase(
  slug: string,
  category: ComponentReferenceCategory,
  lane?: string,
): string {
  if (slug.includes("caption") || slug.includes("karaoke")) {
    return "captioned videos, social clips, and synced text scenes";
  }
  if (
    slug.includes("chart") ||
    slug.includes("metric") ||
    slug.includes("counter") ||
    slug.includes("data")
  ) {
    return "data stories, metrics, charts, and numeric proof points";
  }
  if (
    slug.includes("audio") ||
    slug.includes("waveform") ||
    slug.includes("audiogram") ||
    slug.includes("podcast")
  ) {
    return "audio-first videos, podcast clips, and waveform visuals";
  }
  if (lane === "cuts" || slug.startsWith("transition-")) {
    return "scene transitions and composition pacing";
  }
  if (lane === "spatial" || slug.startsWith("map-")) {
    return "map scenes, routes, markers, and spatial storytelling";
  }
  if (category === "composition") {
    return "complete video templates that can be customized as source";
  }
  if (category === "scene") {
    return "full-frame scenes, overlays, cards, and reusable video sections";
  }
  return "frame-level motion primitives and reusable animation wrappers";
}

type ComponentReferenceCategory =
  | "primitive"
  | "scene"
  | "composition"
  | "utility";

function getAiCustomizationKnobs(props: { name: string }[]): string {
  const propNames = props
    .map((prop) => prop.name)
    .filter((propName) => propName !== "children")
    .slice(0, 4);

  if (propNames.length === 0) {
    return "edit the copied source file for timing, layout, colors, and typography";
  }

  return `${propNames.join(", ")}, plus copied source for timing, layout, colors, and typography`;
}
