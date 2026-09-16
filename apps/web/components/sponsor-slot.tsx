import Link from "next/link";

/**
 * The one sponsor placement, at the foot of every component page: the pages
 * that carry most of the site's views. Shows the open slot until a sponsor
 * signs; swap the body for their logo then, not a second slot beside it.
 */
export function SponsorSlot() {
  return (
    <aside className="not-prose mt-12 flex flex-col gap-3 rounded-sm border border-dashed border-[var(--bay-border-strong)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-mono-xs uppercase text-fd-muted-foreground">
          Sponsor slot open
        </p>
        <p className="mt-1 text-sm text-fd-foreground">
          Put your product in front of developers building videos in React.
        </p>
      </div>
      <Link
        href="/sponsor"
        className="inline-flex w-fit shrink-0 items-center rounded-sm border border-[var(--bay-border-strong)] px-3 py-1.5 text-sm transition-colors hover:border-[var(--bay-phosphor)]"
      >
        Sponsor RemotionUI
      </Link>
    </aside>
  );
}
