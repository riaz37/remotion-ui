import type { ReactNode } from "react";
import { CopyButton } from "../copy-button";

type BayCodePanelProps = {
  headerLeft?: ReactNode;
  copyText: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function BayCodePanel({
  headerLeft,
  copyText,
  headerRight,
  children,
  className = "",
}: BayCodePanelProps) {
  return (
    <div
      className={`not-prose my-4 rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)] ${className}`}
    >
      <div className="flex flex-col gap-3 border-b border-[var(--bay-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">{headerLeft}</div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2">
          {headerRight}
          <CopyButton text={copyText} />
        </div>
      </div>
      <div className="overflow-x-auto px-4 py-3 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}
