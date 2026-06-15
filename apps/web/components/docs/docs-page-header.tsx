import Link from "next/link";
import type { ReactNode } from "react";

type DocsPageHeaderProps = {
  title: string;
  lead: ReactNode;
  action?: { href: string; label: string };
  className?: string;
};

export function DocsPageHeader({
  title,
  lead,
  action,
  className = "",
}: DocsPageHeaderProps) {
  return (
    <div
      className={`not-prose flex flex-wrap items-end justify-between gap-4 border-b border-[var(--bay-border)] pb-10 ${className}`}
    >
      <div className="max-w-xl">
        <h1 className="text-display-lg">{title}</h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
          {lead}
        </p>
      </div>
      {action ? (
        <Link href={action.href} className="link-phosphor text-sm font-medium">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
