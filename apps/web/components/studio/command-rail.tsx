"use client";

import { useState } from "react";
import { CopyButton } from "../copy-button";

type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

const PM_LABELS: Record<PackageManager, string> = {
  pnpm: "pnpm",
  npm: "npm",
  yarn: "yarn",
  bun: "bun",
};

function formatCommand(base: string, pm: PackageManager): string {
  if (pm === "npm") return base.replace(/^npx /, "npx ");
  if (pm === "pnpm") return base.replace(/^npx /, "pnpm dlx ");
  if (pm === "yarn") return base.replace(/^npx /, "yarn dlx ");
  return base.replace(/^npx /, "bunx ");
}

type CommandRailProps = {
  label?: string;
  command: string;
  showPmTabs?: boolean;
  step?: number;
  className?: string;
};

export function CommandRail({
  label,
  command,
  showPmTabs = false,
  step,
  className = "",
}: CommandRailProps) {
  const [pm, setPm] = useState<PackageManager>("npm");
  const displayCommand = showPmTabs ? formatCommand(command, pm) : command;

  return (
    <div
      className={`not-prose overflow-hidden rounded-md border border-[var(--bay-border)] border-l-2 border-l-[var(--bay-phosphor)] bg-[var(--bay-surface)] ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[var(--bay-border)] px-4 py-2">
        <div className="flex items-center gap-2">
          {step ? (
            <span className="text-mono-xs text-[var(--bay-phosphor)]">
              {String(step).padStart(2, "0")}
            </span>
          ) : null}
          {label ? (
            <span className="text-sm font-medium text-fd-foreground">
              {label}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {showPmTabs ? (
            <div className="flex gap-3">
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
          <CopyButton text={displayCommand} />
        </div>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-sm leading-relaxed">
        <code className="font-[family-name:var(--font-mono)] text-fd-foreground">
          <span className="text-[var(--bay-phosphor)]">$ </span>
          {displayCommand}
        </code>
      </pre>
    </div>
  );
}

export function CompactCommandRail({
  command,
  className = "",
}: {
  command: string;
  className?: string;
}) {
  return (
    <div
      className={`not-prose flex items-center justify-between gap-3 overflow-hidden rounded-md border border-[var(--bay-border)] border-l-2 border-l-[var(--bay-phosphor)] bg-[var(--bay-surface)] px-3 py-2 ${className}`}
    >
      <code className="min-w-0 truncate font-[family-name:var(--font-mono)] text-[0.8125rem] text-fd-foreground">
        <span className="text-[var(--bay-phosphor)]">$ </span>
        {command}
      </code>
      <CopyButton text={command} />
    </div>
  );
}
