"use client";

import { useEffect, useState } from "react";
import { fetchGitHubStarsClient, formatGitHubStars } from "@/lib/github-stars";
import { GitHubIcon } from "@/components/brand-icons";
import { siteConfig } from "@/lib/site-config";

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
    </svg>
  );
}

export function GitHubStarButton() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      const count = await fetchGitHubStarsClient();
      if (active) setStars(count);
    })();

    return () => {
      active = false;
    };
  }, []);

  const label =
    stars != null
      ? `${formatGitHubStars(stars)} GitHub stars`
      : "View RemotionUI on GitHub";

  return (
    <a
      href={siteConfig.githubUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex items-center gap-1.5 rounded-md border bg-fd-secondary px-2.5 py-1.5 text-sm font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
    >
      <GitHubIcon className="size-4 shrink-0" />
      <StarIcon className="size-3.5 shrink-0 text-amber-400" />
      <span className="min-w-[2ch] font-[family-name:var(--font-mono)] text-xs tabular-nums">
        {stars != null ? formatGitHubStars(stars) : "…"}
      </span>
    </a>
  );
}
