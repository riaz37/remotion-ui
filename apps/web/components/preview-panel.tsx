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
    <div className="overflow-hidden rounded-lg border border-fd-border bg-fd-card shadow-sm shadow-black/5">
      <div className="flex items-center justify-between border-b border-fd-border px-4 py-2.5">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-fd-foreground">
          <span className="size-2 rounded-full bg-fd-primary" aria-hidden />
          {title}
        </span>
        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-fd-muted-foreground">
          Remotion
        </span>
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
