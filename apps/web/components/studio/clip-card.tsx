import Link from "next/link";
import type { ReactNode } from "react";
import type { AtlasLane } from "@/lib/atlas";

type ClipCardProps = {
  name: string;
  url: string;
  durationFrames?: number;
  lane?: AtlasLane;
  command?: string;
  thumbnail: ReactNode;
  className?: string;
};

export function ClipCard({
  name,
  url,
  durationFrames,
  lane,
  command,
  thumbnail,
  className = "",
}: ClipCardProps) {
  const displayName = name.replace(/-/g, " ");

  return (
    <Link
      href={url}
      className={`motion-border group flex min-w-[220px] flex-col overflow-hidden rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)] hover:border-[var(--bay-border-strong)] ${className}`}
    >
      <div className="min-h-0 flex-1">{thumbnail}</div>
      <div className="border-t border-[var(--bay-border)] px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold capitalize text-fd-foreground">
            {displayName}
          </p>
          {durationFrames ? (
            <span className="text-mono-xs shrink-0 text-fd-muted-foreground">
              {durationFrames}f
            </span>
          ) : null}
        </div>
        {command ? (
          <p className="mt-1 truncate font-[family-name:var(--font-mono)] text-[0.6875rem] text-fd-muted-foreground">
            {command}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
