import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/landing/reveal";
import { PerforationRule } from "@/components/studio/perforation-rule";

type LandingLayout = "bin" | "wide" | "narrow" | "full-bleed";

/**
 * Header composition. Sections deliberately do not share one shape: a page
 * where every heading sits in the same slot reads as a template.
 */
type HeaderKind = "stacked" | "indented" | "hung";

/** Vertical rhythm. Uniform padding everywhere is the tell we are breaking. */
type Rhythm = "tight" | "default" | "tall";

const LAYOUT_MAX: Record<LandingLayout, string> = {
  bin: "max-w-[1120px]",
  wide: "max-w-[1280px]",
  narrow: "max-w-[960px]",
  "full-bleed": "max-w-[1280px]",
};

const RHYTHM_Y: Record<Rhythm, string> = {
  tight: "py-[88px]",
  default: "py-[120px]",
  tall: "py-[152px]",
};

type LandingSectionProps = {
  title: string;
  lead: string;
  layout?: LandingLayout;
  header?: HeaderKind;
  rhythm?: Rhythm;
  action?: { href: string; label: string };
  children: ReactNode;
  className?: string;
  showTopPerforation?: boolean;
};

export function LandingSection({
  title,
  lead,
  layout = "bin",
  header = "stacked",
  rhythm = "default",
  action,
  children,
  className = "",
  showTopPerforation = true,
}: LandingSectionProps) {
  return (
    <section
      className={`relative border-b border-[var(--bay-border)] ${className}`}
    >
      {/*
        The perforation belongs on the section's cut edge. Rendered in normal
        flow it was sitting one whole rhythm-step down the page, reading as a
        stray rule rather than the seam between two strips of film.
      */}
      {showTopPerforation ? (
        <PerforationRule className="absolute inset-x-0 top-0" />
      ) : null}
      <div
        className={`mx-auto px-6 ${RHYTHM_Y[rhythm]} ${LAYOUT_MAX[layout]}`}
      >
        <Reveal>
          <SectionHeader
            kind={header}
            title={title}
            lead={lead}
            action={action}
          />
        </Reveal>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

function SectionHeader({
  kind,
  title,
  lead,
  action,
}: {
  kind: HeaderKind;
  title: string;
  lead: string;
  action?: LandingSectionProps["action"];
}) {
  const actionLink = action ? (
    <Link href={action.href} className="link-phosphor text-sm font-medium">
      {action.label}
    </Link>
  ) : null;

  /**
   * Hung: the heading hangs into the left margin and the lead sits under it in
   * a narrower measure. The action drops to its own line so it never becomes a
   * floating corner paragraph.
   */
  if (kind === "hung") {
    return (
      <div>
        <h2 className="text-display-lg -ml-0.5 md:-ml-1">{title}</h2>
        <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
          {lead}
        </p>
        {actionLink ? <div className="mt-6">{actionLink}</div> : null}
      </div>
    );
  }

  /**
   * Indented: heading pushed off the left edge into the second column, so the
   * section reads as a deliberate step inward rather than another flush block.
   */
  if (kind === "indented") {
    return (
      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-7 md:col-start-4">
          <h2 className="text-display-lg">{title}</h2>
          <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
            {lead}
          </p>
          {actionLink ? <div className="mt-6">{actionLink}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-xl">
        <h2 className="text-display-lg">{title}</h2>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
          {lead}
        </p>
      </div>
      {actionLink}
    </div>
  );
}
