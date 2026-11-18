import { memfindOffer } from "@/components/memfind/memfind-offer";

/**
 * The one nav item that is not documentation. The price pill, not the name,
 * is what tells a first-time visitor why they'd click.
 */
export const memfindNavLink = {
  type: "custom" as const,
  children: (
    <a
      href={memfindOffer.siteUrl}
      target="_blank"
      rel="noopener"
      className="group inline-flex items-center gap-2 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
    >
      {memfindOffer.name}
      <span className="text-mono-xs rounded-full border border-[var(--bay-phosphor)]/45 px-2 py-0.5 uppercase text-[var(--bay-phosphor)] transition-colors group-hover:border-[var(--bay-phosphor)]">
        {memfindOffer.price}
      </span>
    </a>
  ),
};
