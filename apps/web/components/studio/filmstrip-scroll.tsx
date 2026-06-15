"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type FilmstripScrollProps = {
  children: ReactNode;
  /** Gap between items in px — must match flex gap on track */
  gap?: number;
  className?: string;
  /** Horizontal padding on scroll track (aligns first/last card with section headline) */
  paddingX?: number;
};

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M10 12L6 8l4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FilmstripScroll({
  children,
  gap = 16,
  className = "",
  paddingX = 24,
}: FilmstripScrollProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    updateScrollState();

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => observer.disconnect();
  }, [updateScrollState, children]);

  const scrollByStep = useCallback(
    (direction: -1 | 1) => {
      const el = trackRef.current;
      if (!el) return;

      const firstChild = el.firstElementChild as HTMLElement | null;
      const step = firstChild
        ? firstChild.offsetWidth + gap
        : el.clientWidth * 0.8;

      el.scrollBy({
        left: direction * step,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    },
    [gap, reducedMotion],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollByStep(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollByStep(1);
    }
  };

  return (
    <div className={`relative -mx-6 ${className}`}>
      {/* Left fade */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 transition-opacity duration-150 sm:w-14"
        style={{
          background:
            "linear-gradient(to right, var(--bay-bg) 0%, transparent 100%)",
          opacity: canLeft ? 1 : 0,
        }}
        aria-hidden
      />

      {/* Right fade */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 transition-opacity duration-150 sm:w-14"
        style={{
          background:
            "linear-gradient(to left, var(--bay-bg) 0%, transparent 100%)",
          opacity: canRight ? 1 : 0,
        }}
        aria-hidden
      />

      {/* Prev arrow */}
      {canLeft ? (
        <button
          type="button"
          onClick={() => scrollByStep(-1)}
          className="absolute left-2 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm border border-[var(--bay-border-strong)] bg-[var(--bay-surface)] text-[var(--bay-phosphor)] transition-colors hover:border-[var(--bay-phosphor)]"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-4" />
        </button>
      ) : null}

      {/* Next arrow */}
      {canRight ? (
        <button
          type="button"
          onClick={() => scrollByStep(1)}
          className="absolute right-2 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm border border-[var(--bay-border-strong)] bg-[var(--bay-surface)] text-[var(--bay-phosphor)] transition-colors hover:border-[var(--bay-phosphor)]"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-4" />
        </button>
      ) : null}

      {/* Scroll track */}
      <div
        ref={trackRef}
        tabIndex={0}
        role="region"
        aria-label="Scrollable filmstrip"
        onScroll={updateScrollState}
        onKeyDown={handleKeyDown}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bay-phosphor)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bay-bg)]"
        style={{
          paddingLeft: paddingX,
          paddingRight: paddingX,
          scrollbarWidth: "thin",
        }}
      >
        {children}
      </div>
    </div>
  );
}
