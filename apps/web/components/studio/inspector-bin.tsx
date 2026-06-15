import type { ReactNode } from "react";

type InspectorBinProps = {
  label?: string;
  children: ReactNode;
  className?: string;
};

/** Marketing copy panel styled as an NLE inspector bin. */
export function InspectorBin({
  label = "Project",
  children,
  className = "",
}: InspectorBinProps) {
  return (
    <aside className={`lg:max-w-[340px] lg:shrink-0 ${className}`}>
      <p className="font-[family-name:var(--font-mono)] text-[0.6875rem] text-fd-muted-foreground">
        {label}
      </p>
      <div className="mt-4">{children}</div>
    </aside>
  );
}
