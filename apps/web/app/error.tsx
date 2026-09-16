"use client";

import { useEffect } from "react";
import { SiteFooter } from "@/components/site-footer";
import { StatusSlate, statusSlateButtonClass } from "@/components/status-slate";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Client-side errors never reach the server logs on their own.
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col">
      <StatusSlate
        code={error.digest ? `Error · ${error.digest}` : "Error"}
        title="That render dropped a frame."
        description="Something failed while loading this page. Retrying often clears it; if it keeps happening, the details above help us trace it."
        primary={{ label: "Back home", href: "/" }}
        secondary={{ label: "Browse components", href: "/docs/components" }}
      >
        <button type="button" onClick={reset} className={statusSlateButtonClass}>
          Try again
        </button>
      </StatusSlate>
      <SiteFooter />
    </div>
  );
}
