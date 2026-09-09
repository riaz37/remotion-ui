"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EarlyAccessForm } from "@/components/early-access/early-access-form";
import { earlyAccessCopy } from "@/components/early-access/early-access-copy";

const STORAGE_KEY = "remotionui:kine-corner-promo";

/** Long enough to not compete with the page's own first paint. */
const ARM_DELAY_MS = 4_000;

/** Routes where the ask would be redundant — you're already on the Kine page. */
const SUPPRESSED_PREFIXES = ["/kine"];

/**
 * A Supabase-Select-style corner card: persistent (not an exit trap), a real
 * clip of the product instead of decoration, one outbound CTA. Replaces
 * ExitIntentPrompt — running both a corner card and an exit modal asks twice.
 */
export function KineCornerPromo() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);

  const suppressed = SUPPRESSED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  useEffect(() => {
    if (suppressed) return;
    if (readDismissed()) return;

    const timer = window.setTimeout(() => setOpen(true), ARM_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [suppressed]);

  const remember = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      /* Private mode. The card may reappear next visit; that is acceptable. */
    }
  };

  const close = () => {
    setOpen(false);
    remember();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="complementary"
          aria-label={`${earlyAccessCopy.name} early access`}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: 8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-5 right-5 z-40 hidden w-80 overflow-hidden rounded-sm border border-[var(--bay-border-strong)] bg-[var(--bay-surface)] shadow-2xl sm:block"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-2 top-2 z-10 rounded-sm bg-black/40 px-1.5 py-1 text-xs text-white/80 backdrop-blur-sm transition-colors hover:text-white"
          >
            ✕
          </button>

          <video
            className="block aspect-video w-full bg-black object-cover"
            src="/kine-launch-film.mp4"
            poster="/kine-launch-film-poster.jpg"
            muted
            autoPlay
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />

          <div className="p-4">
            <p className="text-mono-xs uppercase text-[var(--bay-phosphor)]">
              {earlyAccessCopy.eyebrow}
            </p>
            <p className="mt-1.5 text-sm font-medium tracking-tight text-fd-foreground">
              {earlyAccessCopy.definition}
            </p>

            <EarlyAccessForm
              source="corner-promo"
              className="mt-3 [&_.flex]:!flex-col"
              onSubscribed={() => {
                remember();
                window.setTimeout(() => setOpen(false), 2_200);
              }}
            />

            <Link
              href="/kine"
              className="mt-2 inline-block text-xs text-fd-muted-foreground underline decoration-fd-muted-foreground/40 underline-offset-4 transition-colors hover:text-fd-foreground hover:decoration-fd-foreground"
            >
              Learn more about Kine
            </Link>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "dismissed";
  } catch {
    return false;
  }
}
