import Link from "next/link";
import type { ReactNode } from "react";

interface StatusSlateAction {
  label: string;
  href: string;
}

interface StatusSlateProps {
  code: string;
  title: string;
  description: string;
  primary: StatusSlateAction;
  secondary?: StatusSlateAction;
  /** Rendered under the actions. Used for client-only controls like a retry button. */
  children?: ReactNode;
}

/**
 * Centered slate for terminal states (404, runtime error). Mirrors the end-slate
 * composition so an error still reads as part of the site, not a browser default.
 */
export function StatusSlate({
  code,
  title,
  description,
  primary,
  secondary,
  children,
}: StatusSlateProps) {
  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col justify-center px-6 py-[136px] text-center">
      <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-fd-muted-foreground">
        {code}
      </p>
      <h1 className="mt-5 text-display-lg">{title}</h1>
      <p className="mx-auto mt-4 max-w-md text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
        {description}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href={primary.href} className={statusSlateButtonClass}>
          {primary.label}
        </Link>
        {secondary ? (
          <Link
            href={secondary.href}
            className="link-phosphor inline-flex items-center px-1 py-2.5 text-sm font-medium"
          >
            {secondary.label}
          </Link>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export const statusSlateButtonClass =
  "inline-flex items-center rounded-sm border border-[var(--bay-border-strong)] bg-[var(--bay-surface-raised)] px-4 py-2.5 text-sm font-medium text-fd-foreground transition-[border-color,transform] duration-200 hover:border-[var(--bay-phosphor)] active:translate-y-px";
