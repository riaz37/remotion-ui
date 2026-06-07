import type { ReactNode } from "react";

export function PreviewPanel({
  title = "Live preview",
  aspectRatio = "16 / 9",
  children,
}: {
  title?: string;
  /** CSS aspect-ratio value, e.g. "16 / 9" or "9 / 16" */
  aspectRatio?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-card">
      <div className="flex items-center justify-between border-b border-fd-border px-4 py-2.5">
        <span className="text-sm font-medium text-fd-foreground">{title}</span>
      </div>
      <div
        className="w-full bg-[var(--brand-stage)]"
        style={{ aspectRatio }}
      >
        {children}
      </div>
    </div>
  );
}
