import Link from "next/link";
import type { CSSProperties } from "react";
import { ProgramMonitor } from "@/components/landing/program-monitor";
import { CompactCommandRail } from "@/components/studio/command-rail";
import { componentCount } from "@/lib/registry-facts";

const HERO_INSTALL = "npx remotion-ui@latest add social-clip";

/** Stagger position for the arrival cascade, read by `.hero-rise` in CSS. */
const rise = (index: number) => ({ "--rise-index": index }) as CSSProperties;

/**
 * Hero copy.
 *
 * Server-rendered on purpose: the headline is the first thing that paints and
 * it should not wait on the Player's bundle. Everything interactive lives in
 * ProgramMonitor and the command rail, both client leaves.
 *
 * Four elements, no more: headline, one line of subtext, the install command,
 * one text link. The picture is carrying the rest of the argument.
 */
export function StudioHero() {
  return (
    <ProgramMonitor>
      <>
        <h1
          id="hero-headline"
          className="hero-rise text-display-hero"
          style={rise(0)}
        >
          Production-ready motion
          <span className="block text-[var(--bay-muted)]">for Remotion.</span>
        </h1>

        <p
          className="hero-rise mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-fd-muted-foreground"
          style={rise(1)}
        >
          Install any of {componentCount} components with the CLI. The source
          lands in your repo, with no runtime dependency.
        </p>

        <div
          className="hero-rise mt-7 flex flex-wrap items-center gap-x-6 gap-y-3"
          style={rise(2)}
        >
          <CompactCommandRail
            command={HERO_INSTALL}
            className="w-full max-w-[26rem] sm:w-auto"
          />
          {/* py-3 keeps the tap target at 44px, matching the command rail. */}
          <Link
            href="/docs/components"
            className="link-phosphor inline-flex items-center rounded-sm px-1 py-3 text-sm font-medium transition-transform duration-150 outline-none focus-visible:ring-1 focus-visible:ring-[var(--bay-phosphor)] active:translate-y-px"
          >
            Browse components
          </Link>
        </div>
      </>
    </ProgramMonitor>
  );
}
