"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import type { PropDefinition } from "@/lib/component-reference";
import { InspectorPanel } from "./studio/inspector-panel";
import { StudioPanel } from "./studio/studio-panel";
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

  const fields = editableProps.map((prop) => ({
    name: prop.name,
    value: values[prop.name] ?? "",
    onChange: (value: string) =>
      setValues((current) => ({ ...current, [prop.name]: value })),
    placeholder: prop.description,
  }));

  return (
    <InspectorPanel
      fields={fields}
      usageSnippet={usageSnippet}
      className={`mb-8 ${isPortrait ? "" : ""}`}
      preview={
        <div
          className={`mb-8 lg:mb-0 ${isPortrait ? "w-72 max-w-full lg:justify-self-end" : ""}`}
        >
          <StudioPanel
            label={name}
            aspectRatio={previewAspect}
            fps={30}
            width={previewWidth}
            height={previewHeight}
            durationInFrames={durationInFrames}
          >
            <RemotionPreview
              component={component}
              durationInFrames={durationInFrames}
              width={previewWidth}
              height={previewHeight}
              inputProps={inputProps}
            />
          </StudioPanel>
        </div>
      }
    />
  );
}

function toComponentName(slug: string): string {
  return slug
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join("");
}
