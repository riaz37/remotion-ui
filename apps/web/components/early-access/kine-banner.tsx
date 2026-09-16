"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "remotionui:kine-banner-2026-09";

/**
 * Sits above the nav on the homepage only. Dismissal persists in
 * localStorage, so a visitor who closes it won't see it again on this
 * device. Deliberately not fumadocs' `Banner`, since its FOUC-prevention `<script>`
 * triggers a "scripts never execute on client render" dev warning, which we
 * don't need since this banner doesn't shift page layout.
 */
export function KineBanner() {
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
    <div className="relative flex items-center justify-center gap-2 bg-fd-secondary px-4 py-2.5 text-center text-sm">
      <Link href="/kine" className="group inline-flex items-center gap-2">
        <span className="text-mono-xs rounded-full border border-[var(--bay-phosphor)]/45 px-2 py-0.5 uppercase text-[var(--bay-phosphor)] transition-colors group-hover:border-[var(--bay-phosphor)]">
          New
        </span>
        <span>
          Kine turns your localhost into a demo video. Early access is open
        </span>
        <span className="underline decoration-fd-muted-foreground/40 underline-offset-4 transition-colors group-hover:decoration-fd-foreground">
          Join the waitlist →
        </span>
      </Link>

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
