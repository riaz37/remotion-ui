"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { EarlyAccessForm } from "@/components/early-access/early-access-form";
import { earlyAccessCopy } from "@/components/early-access/early-access-copy";

const STORAGE_KEY = "remotionui:early-access-prompt";

/** Once someone answers the prompt either way, it stops asking. */
type PromptState = "dismissed" | "subscribed";

/** Long enough that the prompt reads as an exit, not a greeting. */
const ARM_DELAY_MS = 8_000;

/** Routes where the ask would be redundant or unwelcome. */
const SUPPRESSED_PREFIXES = ["/cutaway"];

export function ExitIntentPrompt() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  const suppressed = SUPPRESSED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  const remember = useCallback((state: PromptState) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, state);
    } catch {
      /* Private mode. The prompt may reappear next visit; that is acceptable. */
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    remember("dismissed");
    restoreFocusRef.current?.focus?.();
  }, [remember]);

  useEffect(() => {
    if (suppressed) return;
    if (readState()) return;

    let armed = false;
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, ARM_DELAY_MS);

    /*
      Exit intent is the pointer crossing the top edge of the viewport, which
      is where the tab bar and the address bar live. Touch devices never fire
      this, and that is deliberate: there is no non-annoying exit signal on a
      phone.
    */
    const onMouseOut = (event: MouseEvent) => {
      if (!armed) return;
      if (event.relatedTarget || event.clientY > 0) return;

      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };

    document.addEventListener("mouseout", onMouseOut);

    return () => {
      window.clearTimeout(armTimer);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, [suppressed]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"])',
      );

      if (!focusables?.length) return;

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [close, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-intent-title"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md rounded-sm border border-[var(--bay-border-strong)] bg-[var(--bay-surface)] p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-mono-xs uppercase text-[var(--bay-phosphor)]">
                {earlyAccessCopy.eyebrow}
              </p>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="-mr-1 -mt-1 rounded-sm px-2 py-1 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              >
                ✕
              </button>
            </div>

            <h2
              id="exit-intent-title"
              className="mt-3 font-[family-name:var(--font-display)] text-xl font-medium tracking-tight"
            >
              {earlyAccessCopy.modalTitle}
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
              {earlyAccessCopy.modalLead}
            </p>

            <EarlyAccessForm
              source="exit-intent"
              autoFocus
              className="mt-5"
              onSubscribed={() => {
                remember("subscribed");
                window.setTimeout(() => setOpen(false), 2_200);
              }}
            />

            <p className="mt-3 text-xs leading-relaxed text-fd-muted-foreground">
              {earlyAccessCopy.assurance}
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function readState(): PromptState | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY) as PromptState | null;
  } catch {
    return null;
  }
}
