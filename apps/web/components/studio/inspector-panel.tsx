"use client";

import type { ReactNode } from "react";

type InspectorField = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

type InspectorPanelProps = {
  fields: InspectorField[];
  usageSnippet?: string;
  preview?: ReactNode;
  className?: string;
};

export function InspectorPanel({
  fields,
  usageSnippet,
  preview,
  className = "",
}: InspectorPanelProps) {
  return (
    <div
      className={`not-prose grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start ${className}`}
    >
      <div className="min-w-0 space-y-6">
        <div className="rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)] p-5">
          <h3 className="font-[family-name:var(--font-mono)] text-[0.6875rem] font-medium text-fd-muted-foreground">
            Inspector
          </h3>
          <div className="mt-4 grid gap-5">
            {fields.map((field) => (
              <label key={field.name} className="grid gap-1.5">
                <span className="text-sm font-medium text-fd-foreground">
                  {field.name}
                </span>
                <input
                  type="text"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  placeholder={field.placeholder}
                  className="border-b border-[var(--bay-border)] bg-transparent px-0 py-2 font-[family-name:var(--font-mono)] text-sm text-fd-foreground outline-none focus:border-[var(--bay-phosphor)]"
                />
              </label>
            ))}
          </div>
        </div>
        {usageSnippet ? (
          <div className="rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface-raised)] p-4">
            <p className="mb-2 text-sm font-medium text-fd-foreground">
              Generated usage
            </p>
            <pre className="overflow-x-auto text-xs leading-relaxed">
              <code className="font-[family-name:var(--font-mono)] text-fd-muted-foreground">
                {usageSnippet}
              </code>
            </pre>
          </div>
        ) : null}
      </div>
      {preview ? <div className="lg:sticky lg:top-20">{preview}</div> : null}
    </div>
  );
}
