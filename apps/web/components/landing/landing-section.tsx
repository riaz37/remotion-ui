import Link from "next/link";
import type { ReactNode } from "react";
import { PerforationRule } from "@/components/studio/perforation-rule";

type LandingLayout = "bin" | "wide" | "narrow" | "full-bleed";

const LAYOUT_MAX: Record<LandingLayout, string> = {
  bin: "max-w-[1120px]",
  wide: "max-w-[1280px]",
  narrow: "max-w-[960px]",
  "full-bleed": "max-w-[1280px]",
};

type LandingSectionProps = {
  title: string;
  lead: string;
  layout?: LandingLayout;
  action?: { href: string; label: string };
  children: ReactNode;
  className?: string;
  showTopPerforation?: boolean;
};

export function LandingSection({
  title,
  lead,
  layout = "bin",
  action,
  children,
  className = "",
  showTopPerforation = true,
}: LandingSectionProps) {
  return (
    <section
      className={`border-b border-[var(--bay-border)] py-[120px] ${className}`}
    >
      {showTopPerforation ? <PerforationRule /> : null}
      <div className={`mx-auto px-6 ${LAYOUT_MAX[layout]}`}>
        <div className="flex flex-wrap items-end justify-between gap-4 pt-10">
          <div className="max-w-xl">
            <h2 className="text-display-lg">{title}</h2>
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
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}
