"use client";

import { useState, type ReactNode } from "react";
import { CopyButton } from "@/components/copy-button";

type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

const PM_LABELS: Record<PackageManager, string> = {
  pnpm: "pnpm",
  npm: "npm",
  yarn: "yarn",
  bun: "bun",
};

function formatCommand(base: string, pm: PackageManager): string {
  if (pm === "npm") return base;
  if (pm === "pnpm") return base.replace(/^npx /, "pnpm dlx ");
  if (pm === "yarn") return base.replace(/^npx /, "yarn dlx ");
  return base.replace(/^npx /, "bunx ");
}

type QueueStep = {
  step: number;
  label: string;
  command: string;
  showPmTabs?: boolean;
};

type RenderQueueStripProps = {
  steps: readonly QueueStep[];
  outputPath: string;
  /** Vertical stack for docs prose; horizontal uses a 3-column step grid. */
  layout?: "horizontal" | "vertical";
};

function QueueMarker({
  children,
  filled = true,
}: {
  children: ReactNode;
  filled?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span
        className={
          filled
            ? "size-2 shrink-0 rounded-full bg-[var(--bay-phosphor)]"
            : "size-2 shrink-0 rounded-full border border-[var(--bay-phosphor)] bg-transparent"
        }
        aria-hidden
      />
      <span className="text-mono-xs text-fd-muted-foreground">{children}</span>
    </div>
  );
}

function QueueStepCard({
  step,
  label,
  command,
  showPmTabs = false,
}: QueueStep) {
  const [pm, setPm] = useState<PackageManager>("npm");
  const displayCommand = showPmTabs ? formatCommand(command, pm) : command;

  return (
    <article className="min-w-0">
      <QueueMarker>Queue {String(step).padStart(2, "0")}</QueueMarker>
      <div className="overflow-hidden rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--bay-border)] px-4 py-3">
          <p className="flex min-w-0 items-center gap-2">
            <span className="text-mono-xs shrink-0 text-[var(--bay-phosphor)]">
              {String(step).padStart(2, "0")}
            </span>
            <span className="truncate text-sm font-medium text-fd-foreground">
              {label}
            </span>
          </p>
          <CopyButton text={displayCommand} />
        </div>
        {showPmTabs ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-[var(--bay-border)] px-4 py-2.5">
            {(Object.keys(PM_LABELS) as PackageManager[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPm(key)}
                className={`text-mono-xs transition-colors ${
                  pm === key
                    ? "text-[var(--bay-phosphor)] underline underline-offset-4"
                    : "text-fd-muted-foreground hover:text-fd-foreground"
                }`}
              >
                {PM_LABELS[key]}
              </button>
            ))}
          </div>
        ) : null}
        <div className="overflow-x-auto px-4 py-3">
          <code className="block whitespace-nowrap font-[family-name:var(--font-mono)] text-[0.8125rem] leading-relaxed text-fd-foreground">
            <span className="text-[var(--bay-phosphor)]">$ </span>
            {displayCommand}
          </code>
        </div>
      </div>
    </article>
  );
}

function OutputCard({ outputPath }: { outputPath: string }) {
  return (
    <div className="min-w-0">
      <QueueMarker filled={false}>Output</QueueMarker>
      <div className="rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)] px-4 py-3">
        <p className="truncate font-[family-name:var(--font-mono)] text-[0.8125rem] text-fd-foreground">
          {outputPath}
        </p>
      </div>
    </div>
  );
}

export function RenderQueueStrip({
  steps,
  outputPath,
  layout = "horizontal",
}: RenderQueueStripProps) {
  const isVertical = layout === "vertical";

  if (isVertical) {
    return (
      <div className="space-y-6">
        {steps.map((item) => (
          <QueueStepCard key={item.step} {...item} />
        ))}
        <OutputCard outputPath={outputPath} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {steps.map((item) => (
          <QueueStepCard key={item.step} {...item} />
        ))}
      </div>
      <div className="max-w-xs">
        <OutputCard outputPath={outputPath} />
      </div>
    </div>
  );
}
