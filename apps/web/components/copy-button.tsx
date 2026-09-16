"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CopyStatus = "idle" | "copied" | "error";

const RESET_DELAY_MS = 2000;

const LABELS: Record<CopyStatus, string> = {
  idle: "Copy",
  copied: "Copied",
  error: "Failed",
};

const ARIA_LABELS: Record<CopyStatus, string> = {
  idle: "Copy to clipboard",
  copied: "Copied to clipboard",
  error: "Copy failed — select the command and copy manually",
};

/**
 * Copy control for the command rails.
 *
 * `iconOnly` drops the text and squares the padding, which is what the hero
 * rail uses: the command is the call to action there, and a word next to it
 * competes with the command for the same glance. Losing the label means the
 * click has to confirm itself visually, so the state change is animated —
 * see `.copy-btn` in globals.css.
 */
export function CopyButton({
  text,
  iconOnly = false,
}: {
  text: string;
  iconOnly?: boolean;
}) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<number | undefined>(undefined);

  // The 2s reset outlives a fast navigation away from the page.
  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      // writeText rejects on insecure origins and when the permission is
      // denied. Say so rather than leaving a button that looks inert.
      setStatus("error");
    }

    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(
      () => setStatus("idle"),
      RESET_DELAY_MS,
    );
  }, [text]);

  // Resting fill is the darker surface so the muted label clears WCAG AA in
  // dark mode; the raised surface is the hover state.
  return (
    <button
      type="button"
      onClick={copy}
      data-status={status}
      aria-label={ARIA_LABELS[status]}
      className={`copy-btn inline-flex items-center gap-1.5 rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)] text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-[var(--bay-surface-raised)] hover:text-fd-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--bay-phosphor)] ${
        iconOnly ? "p-2" : "px-2.5 py-1"
      }`}
    >
      {/* Paints over the button fill, not under it: no z-index needed. */}
      <span className="copy-btn-ring" aria-hidden />

      {/* Both marks share one grid cell so the swap never shifts the layout. */}
      <span className="copy-btn-icons" aria-hidden>
        <CopyIcon />
        <CheckIcon />
      </span>

      {iconOnly ? null : (
        <span className="copy-btn-label">{LABELS[status]}</span>
      )}

      {/* Icon-only leaves nothing for a screen reader to notice on success. */}
      <span className="sr-only" role="status" aria-live="polite">
        {status === "idle" ? "" : ARIA_LABELS[status]}
      </span>
    </button>
  );
}

function CopyIcon() {
  return (
    <svg
      className="copy-btn-icon copy-btn-icon-copy"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="copy-btn-icon copy-btn-icon-check"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        className="copy-btn-check-path"
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
