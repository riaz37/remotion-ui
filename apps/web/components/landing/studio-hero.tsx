"use client";

import Link from "next/link";
import { CompactCommandRail } from "@/components/studio/command-rail";
import { StudioPlayerPanel } from "@/components/studio/studio-player-panel";
import { HeroLoopPreview } from "@/components/previews/hero-loop";

const HERO_INSTALL = "npx remotion-ui@latest add social-clip";

export function StudioHero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--bay-border)]">
      <div className="film-grain" aria-hidden />
      <div className="relative mx-auto grid w-full max-w-[1120px] gap-10 px-6 py-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-14 lg:py-24">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-[0.6875rem] text-fd-muted-foreground">
            New · Composition registry for Remotion
          </p>
          <h1 className="text-display-xl mt-5">
            Compositions you own,
            <span className="block text-fd-muted-foreground">frame by frame.</span>
          </h1>
          <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
            Install social clips, data stories, and reels with the CLI. Every
            component copies into your repo as source.
          </p>
          <div className="mt-7 max-w-md">
            <CompactCommandRail command={HERO_INSTALL} />
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/docs/components"
              className="inline-flex items-center rounded-sm border border-[var(--bay-border-strong)] bg-[var(--bay-surface-raised)] px-4 py-2.5 text-sm font-medium text-fd-foreground transition-colors hover:border-[var(--bay-phosphor)]"
            >
              Browse storyboard
            </Link>
            <Link
              href="/docs"
              className="link-phosphor inline-flex items-center px-1 py-2.5 text-sm font-medium"
            >
              Read docs
            </Link>
          </div>
        </div>
        <div className="w-full">
          <StudioPlayerPanel
            label="hero-loop"
            component={HeroLoopPreview}
            durationInFrames={450}
            fps={30}
            width={1920}
            height={1080}
            showTimecode
          />
        </div>
      </div>
    </section>
  );
}
