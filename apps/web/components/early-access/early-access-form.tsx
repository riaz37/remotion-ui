"use client";

import { useId, useState, type FormEvent } from "react";
import type { EarlyAccessSource } from "@/lib/early-access";

type Status = "idle" | "submitting" | "created" | "duplicate" | "error";

type EarlyAccessFormProps = {
  source: EarlyAccessSource;
  /** Fires once the row is safely on the list, for surfaces that self-dismiss. */
  onSubscribed?: () => void;
  autoFocus?: boolean;
  className?: string;
};

const SUCCESS_COPY: Record<"created" | "duplicate", string> = {
  created: "You're on the list. We'll email you when your spot opens.",
  duplicate: "You're already on the list. Nothing more to do.",
};

export function EarlyAccessForm({
  source,
  onSubscribed,
  autoFocus = false,
  className = "",
}: EarlyAccessFormProps) {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const submitting = status === "submitting";
  const done = status === "created" || status === "duplicate";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || done) return;

    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, company }),
      });

      const body = (await response.json().catch(() => null)) as
        | { ok: boolean; status?: "created" | "duplicate"; error?: string }
        | null;

      if (!response.ok || !body?.ok) {
        setStatus("error");
        setError(body?.error ?? "Something went wrong. Try again.");
        return;
      }

      setStatus(body.status === "duplicate" ? "duplicate" : "created");
      onSubscribed?.();
    } catch {
      setStatus("error");
      setError("Network error. Check your connection and try again.");
    }
  }

  if (done) {
    return (
      <p
        role="status"
        className={`text-[0.9375rem] leading-relaxed text-fd-foreground ${className}`}
      >
        <span
          aria-hidden
          className="mr-2 inline-block size-1.5 translate-y-[-2px] rounded-full bg-[var(--bay-phosphor)]"
        />
        {SUCCESS_COPY[status]}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={className}>
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          type="email"
          name="email"
          value={email}
          autoFocus={autoFocus}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status === "error") setStatus("idle");
          }}
          required
          autoComplete="email"
          placeholder="you@company.com"
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? `${inputId}-error` : undefined}
          className="min-w-0 flex-1 rounded-sm border border-[var(--bay-border-strong)] bg-[var(--bay-surface)] px-3.5 py-2.5 text-sm text-fd-foreground outline-none transition-colors placeholder:text-fd-muted-foreground focus-visible:border-[var(--bay-phosphor)]"
        />

        {/*
          Honeypot. Off-screen rather than display:none, which some bots skip,
          and hidden from assistive tech and the tab order.
        */}
        <div aria-hidden className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
          <label htmlFor={`${inputId}-company`}>Company</label>
          <input
            id={`${inputId}-company`}
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex shrink-0 items-center justify-center rounded-sm border border-[var(--bay-border-strong)] bg-[var(--bay-surface-raised)] px-4 py-2.5 text-sm font-medium text-fd-foreground transition-[border-color,transform,opacity] duration-200 hover:border-[var(--bay-phosphor)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Adding you…" : "Get early access"}
        </button>
      </div>

      <p
        id={`${inputId}-error`}
        role="alert"
        aria-live="polite"
        className={`mt-2 text-xs text-[var(--bay-record)] ${error ? "" : "sr-only"}`}
      >
        {error ?? ""}
      </p>
    </form>
  );
}
