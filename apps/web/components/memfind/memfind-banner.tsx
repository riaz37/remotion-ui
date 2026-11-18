"use client";

import { useEffect, useState } from "react";
import { memfindOffer } from "@/components/memfind/memfind-offer";

const STORAGE_KEY = "remotionui:memfind-banner-2026-11";

/**
 * Sits above the nav on the homepage only. Dismissal persists in
 * localStorage. Deliberately not fumadocs' `Banner`: its FOUC-prevention
 * `<script>` triggers a dev warning, and this banner doesn't shift layout.
 */
export function MemfindBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== "dismissed") {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  return (
    <div className="relative flex items-center justify-center gap-2 bg-fd-secondary px-10 py-2.5 text-center text-sm">
      <a
        href={memfindOffer.redeemUrl}
        target="_blank"
        rel="noopener"
        className="group inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1"
      >
        <span className="text-mono-xs rounded-full border border-[var(--bay-phosphor)]/45 px-2 py-0.5 uppercase text-[var(--bay-phosphor)] transition-colors group-hover:border-[var(--bay-phosphor)]">
          From us
        </span>
        <span>
          {memfindOffer.name}: search your phone in your own words.{" "}
          {memfindOffer.price} for RemotionUI users with code{" "}
          <code className="font-mono">{memfindOffer.code}</code>
        </span>
        <span className="underline decoration-fd-muted-foreground/40 underline-offset-4 transition-colors group-hover:decoration-fd-foreground">
          Redeem →
        </span>
      </a>

      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          setOpen(false);
          try {
            window.localStorage.setItem(STORAGE_KEY, "dismissed");
          } catch {
            /* Private mode. The banner may reappear next visit; acceptable. */
          }
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm px-1.5 py-1 text-fd-muted-foreground/60 transition-colors hover:text-fd-foreground"
      >
        ✕
      </button>
    </div>
  );
}
