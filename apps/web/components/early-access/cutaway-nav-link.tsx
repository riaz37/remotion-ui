import Link from "next/link";

/**
 * The one nav item that is not documentation. It carries a status pill because
 * "Cutaway" alone does not tell a first-time visitor that the thing is not
 * shipped yet — and the pill, not the label, is what earns the click.
 */
export const cutawayNavLink = {
  type: "custom" as const,
  children: (
    <Link
      href="/cutaway"
      className="group inline-flex items-center gap-2 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
    >
      Cutaway
      <span className="text-mono-xs rounded-full border border-[var(--bay-phosphor)]/45 px-2 py-0.5 uppercase text-[var(--bay-phosphor)] transition-colors group-hover:border-[var(--bay-phosphor)]">
        Early access
      </span>
    </Link>
  ),
};
