"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { memfindOffer } from "@/components/memfind/memfind-offer";

const STORAGE_KEY = "remotionui:memfind-corner-promo";

/** Long enough to not compete with the page's own first paint. */
const ARM_DELAY_MS = 4_000;

/** Docs readers are mid-task; don't interrupt them. */
const SUPPRESSED_PREFIXES = ["/docs"];

/** A persistent corner card (not an exit trap) with one outbound CTA. */
export function MemfindCornerPromo() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);

  const suppressed = SUPPRESSED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  useEffect(() => {
    if (suppressed || readDismissed()) return;
    const timer = window.setTimeout(() => setOpen(true), ARM_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [suppressed]);

  const close = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      /* Private mode. The card may reappear next visit; that is acceptable. */
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="complementary"
          aria-label={`${memfindOffer.name} offer`}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: 8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-5 right-5 z-40 hidden w-80 rounded-sm border border-[var(--bay-border-strong)] bg-[var(--bay-surface)] p-4 shadow-2xl sm:block"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-2 top-2 rounded-sm px-1.5 py-1 text-xs text-fd-muted-foreground/60 transition-colors hover:text-fd-foreground"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 pr-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={memfindOffer.iconSrc}
              alt=""
              width={44}
              height={44}
              className="size-11 rounded-[10px]"
            />
            <div>
              <p className="text-mono-xs uppercase text-[var(--bay-phosphor)]">
                From the RemotionUI maker
              </p>
              <p className="text-sm font-medium tracking-tight text-fd-foreground">
                {memfindOffer.name} for iPhone, iPad & Mac
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-fd-muted-foreground">
            {memfindOffer.definition}
          </p>

          <p className="mt-3 text-sm text-fd-foreground">
            <span className="text-fd-muted-foreground line-through">
              {memfindOffer.regularPrice}
            </span>{" "}
            {memfindOffer.price} with code{" "}
            <code className="rounded-sm border border-[var(--bay-border)] px-1.5 py-0.5 font-mono text-xs">
              {memfindOffer.code}
            </code>
          </p>

          <a
            href={memfindOffer.redeemUrl}
            target="_blank"
            rel="noopener"
            onClick={close}
            className="mt-3 flex h-9 items-center justify-center rounded-sm bg-fd-foreground text-sm font-medium text-fd-background transition-opacity hover:opacity-90"
          >
            Redeem on the App Store
          </a>

          <a
            href={memfindOffer.siteUrl}
            target="_blank"
            rel="noopener"
            className="mt-2 inline-block text-xs text-fd-muted-foreground underline decoration-fd-muted-foreground/40 underline-offset-4 transition-colors hover:text-fd-foreground hover:decoration-fd-foreground"
          >
            Learn more about {memfindOffer.name}
          </a>
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
