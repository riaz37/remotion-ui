"use client";

import { useEffect, useRef, useState } from "react";

type PageAiActionsProps = {
  /** Full page rendered as Markdown, copied verbatim to the clipboard. */
  markdown: string;
  /** Absolute URL of the Markdown version of this page. */
  markdownUrl: string;
  title: string;
  className?: string;
};

const linkClass =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-fd-muted-foreground transition-colors hover:bg-[var(--bay-surface-raised)] hover:text-fd-foreground";

export function PageAiActions({
  markdown,
  markdownUrl,
  title,
  className,
}: PageAiActionsProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const prompt = `Read ${markdownUrl} and help me use RemotionUI (${title}). Install components with the remotion-ui CLI before importing them.`;

  return (
    <div className={`not-prose flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(markdown);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        }}
        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)] px-2.5 py-1.5 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-[var(--bay-surface-raised)] hover:text-fd-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--bay-phosphor)]"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copied" : "Copy page"}
      </button>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)] px-2.5 py-1.5 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-[var(--bay-surface-raised)] hover:text-fd-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--bay-phosphor)]"
        >
          Open in
          <ChevronIcon open={open} />
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute left-0 top-full z-30 mt-1.5 w-56 overflow-hidden rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)] shadow-lg"
          >
            <a
              className={linkClass}
              href={markdownUrl}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <MarkdownIcon />
              View as Markdown
            </a>
            <a
              className={linkClass}
              href={`https://claude.ai/new?q=${encodeURIComponent(prompt)}`}
              target="_blank"
              rel="noreferrer noopener"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <ChatIcon />
              Open in Claude
            </a>
            <a
              className={linkClass}
              href={`https://chatgpt.com/?hints=search&q=${encodeURIComponent(prompt)}`}
              target="_blank"
              rel="noreferrer noopener"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <ChatIcon />
              Open in ChatGPT
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ transform: open ? "rotate(180deg)" : undefined }}
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MarkdownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6 15V9l3 3 3-3v6M17 9v6m0 0-2-2m2 2 2-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12a8 8 0 0 1-8 8H7l-4 3v-5.5A8 8 0 0 1 11 4h2a8 8 0 0 1 8 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
