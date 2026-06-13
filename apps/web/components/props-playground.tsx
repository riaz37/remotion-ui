"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import type { PropDefinition } from "@/lib/component-reference";
import { PreviewPanel } from "./preview-panel";
import { RemotionPreview } from "./remotion-preview";

type PropsPlaygroundProps = {
  name: string;
  component: ComponentType<Record<string, unknown>>;
  baseProps: Record<string, unknown>;
  editablePropNames: string[];
  propDefinitions: PropDefinition[];
  durationInFrames: number;
  previewWidth: number;
  previewHeight: number;
};

function getDefaultValue(prop: PropDefinition): string {
  if (prop.default) {
    return prop.default.replace(/^"|"$/g, "");
  }
  return "";
}

export function PropsPlayground({
  name,
  component,
  baseProps,
  editablePropNames,
  propDefinitions,
  durationInFrames,
  previewWidth,
  previewHeight,
}: PropsPlaygroundProps) {
  const editableProps = useMemo(
    () =>
      propDefinitions.filter((prop) => editablePropNames.includes(prop.name)),
    [editablePropNames, propDefinitions],
  );

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const prop of editableProps) {
      const fromBase = baseProps[prop.name];
      initial[prop.name] =
        typeof fromBase === "string"
          ? fromBase
          : fromBase !== undefined
            ? String(fromBase)
            : getDefaultValue(prop);
    }
    return initial;
  });

  const inputProps = useMemo(() => {
    const merged = { ...baseProps };
    for (const prop of editableProps) {
      merged[prop.name] = values[prop.name] ?? "";
    }
    return merged;
  }, [baseProps, editableProps, values]);

  const usageSnippet = useMemo(() => {
    const propLines = editablePropNames
      .map((propName) => {
        const value = values[propName];
        if (!value) return null;
        const needsQuotes = !value.startsWith("{") && !value.startsWith("[");
        return `  ${propName}=${needsQuotes ? `"${value}"` : value}`;
      })
      .filter(Boolean)
      .join("\n");

    return `import { ${toComponentName(name)} } from "@/compositions/${name}";

<${toComponentName(name)}
${propLines || "  {...yourProps}"}
/>`;
  }, [editablePropNames, name, values]);

  const previewAspect = `${previewWidth} / ${previewHeight}`;
  const isPortrait = previewHeight > previewWidth;

  return (
    <div className="not-prose mb-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start lg:gap-8">
      <div className="min-w-0 space-y-6 lg:order-1">
        <div className="rounded-2xl border border-fd-border bg-fd-card/70 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
            Live props
          </h2>
          <p className="mt-1 text-sm text-fd-muted-foreground">
            Tweak values and watch the composition update in the preview.
          </p>
          <div className="mt-4 grid gap-4">
            {editableProps.map((prop) => (
              <label key={prop.name} className="grid gap-1.5 text-sm">
                <span className="font-medium">{prop.name}</span>
                <input
                  type="text"
                  value={values[prop.name] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [prop.name]: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-fd-border bg-fd-background px-3 py-2 font-[family-name:var(--font-mono)] text-sm outline-none ring-fd-primary/30 focus:ring-2"
                  placeholder={prop.description}
                />
              </label>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-fd-border bg-fd-muted/30 p-4">
          <p className="mb-2 text-sm font-medium">Generated usage</p>
          <pre className="overflow-x-auto text-xs leading-relaxed">
            <code className="font-[family-name:var(--font-mono)] text-fd-muted-foreground">
              {usageSnippet}
            </code>
          </pre>
        </div>
      </div>
      <div
        className={`mb-8 lg:sticky lg:top-20 lg:order-2 lg:mb-0 ${
          isPortrait ? "w-72 max-w-full lg:justify-self-end" : ""
        }`}
      >
        <PreviewPanel aspectRatio={previewAspect}>
          <RemotionPreview
            component={component}
            durationInFrames={durationInFrames}
            width={previewWidth}
            height={previewHeight}
            inputProps={inputProps}
          />
        </PreviewPanel>
      </div>
    </div>
  );
}

function toComponentName(slug: string): string {
  return slug
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join("");
}
