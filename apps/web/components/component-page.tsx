import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { getAtlasMeta } from "@/lib/atlas";
import { getComponentReference } from "@/lib/component-reference";
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

  const metaLine = [
    reference ? categoryLabels[reference.category] : null,
    atlas?.lane,
    atlas?.tier === "advanced" ? "Advanced" : null,
  ].filter(Boolean);

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

  return (
    <>
      {metaLine.length > 0 ? (
        <p className="not-prose mb-6 text-sm text-fd-muted-foreground">
          {metaLine.map((part, i) => (
            <span key={part}>
              {i > 0 ? (
                <span className="mx-2 text-fd-border" aria-hidden>
                  ·
                </span>
              ) : null}
              <span className={part === "Advanced" ? "text-fd-primary" : ""}>
                {part}
              </span>
            </span>
          ))}
        </p>
      ) : null}

      {preview ? (
        <div className="not-prose mb-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-start lg:gap-8">
          <div className="min-w-0 space-y-6 lg:order-1">
            <InstallCommand name={name} />
            {children ? (
              <div className="text-fd-muted-foreground">{children}</div>
            ) : null}
          </div>
          <div
            className={`mb-8 lg:sticky lg:top-20 lg:order-2 lg:mb-0 ${
              isPortrait ? "max-w-[16rem] lg:max-w-none lg:justify-self-end" : ""
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
                    href={`/docs/${guessCategory(slug)}/${slug}`}
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

function guessCategory(slug: string): string {
  const ref = getComponentReference(slug);
  const atlas = getAtlasMeta(slug);
  if (atlas?.lane === "signals") return "signals";
  if (atlas?.lane === "spatial") return "spatial";
  if (atlas?.lane === "vectors") return "vectors";
  if (atlas?.lane === "cuts") return "cuts";
  if (!ref) return "primitives";
  if (ref.category === "scene") return "scenes";
  if (ref.category === "composition") return "compositions";
  return "primitives";
}
