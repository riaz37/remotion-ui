"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Replaces the root layout when it is the layout itself that failed, so it can
 * rely on nothing from the app: no fonts, no theme provider, no shared CSS.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0c0e",
          color: "#e8e8e6",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <main style={{ maxWidth: 480, padding: 24, textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 12,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              opacity: 0.6,
            }}
          >
            {error.digest ? `Error · ${error.digest}` : "Error"}
          </p>
          <h1 style={{ margin: "20px 0 0", fontSize: 28, fontWeight: 600 }}>
            The site failed to load.
          </h1>
          <p style={{ margin: "16px 0 0", fontSize: 15, lineHeight: 1.6, opacity: 0.7 }}>
            An error broke the page shell itself. Reloading usually recovers it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 32,
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 500,
              color: "inherit",
              background: "#17181b",
              border: "1px solid #303236",
              borderRadius: 3,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
