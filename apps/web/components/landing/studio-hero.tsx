"use client";

import Link from "next/link";
import { HeroLoopPreview } from "@/components/previews/hero-loop";
import { CompactCommandRail } from "@/components/studio/command-rail";
import { EditBayBackdrop } from "@/components/studio/edit-bay-backdrop";
import { InspectorBin } from "@/components/studio/inspector-bin";
import { PerforationRule } from "@/components/studio/perforation-rule";
import { StudioPlayerPanel } from "@/components/studio/studio-player-panel";

const HERO_INSTALL = "npx remotion-ui@latest add social-clip";
const DURATION_IN_FRAMES = 450;
const FPS = 30;

export function StudioHero() {
  return (
    <section className="relative flex min-h-[85svh] flex-col overflow-hidden border-b border-[var(--bay-border)]">
      <EditBayBackdrop />
      <PerforationRule />

      <div className="relative mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-6 py-10 lg:py-14">
        <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          <div className="order-1 min-w-0 lg:order-2 lg:-mr-10 lg:flex-1 lg:pl-6">
            <StudioPlayerPanel
              label="hero-loop"
              component={HeroLoopPreview}
              durationInFrames={DURATION_IN_FRAMES}
              fps={FPS}
              width={1920}
              height={1080}
              showTimecode
              interactiveTimecode
              className="shadow-[0_24px_80px_-12px_rgba(0,0,0,0.55)]"
            />
          </div>

          <div className="order-2 lg:order-1 lg:self-center">
            <InspectorBin label="Composition registry">
              <h1 className="text-display-xl">
                Compositions you own,
                <span className="block text-fd-muted-foreground">
                  frame by frame.
                </span>
              </h1>
              <p className="mt-5 text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
                Install social clips, data stories, and reels with the CLI. Every
                component copies into your repo as source.
              </p>
              <div className="mt-7">
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
            </InspectorBin>
          </div>
        </div>
      </div>

      <PerforationRule />
    </section>
  );
}
