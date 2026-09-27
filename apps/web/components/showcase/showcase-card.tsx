import Link from "next/link";
import type { ShowcaseEntry } from "@/lib/showcase";

const formatDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

function ShowcaseMedia({ entry }: { entry: ShowcaseEntry }) {
  const { video } = entry;

  if (video.kind === "file") {
    return (
      <video
        className="block aspect-video w-full bg-[var(--bay-stage)]"
        src={video.src}
        poster={video.poster}
        controls
        playsInline
        // Films carry sound; nothing loads until the viewer presses play.
        preload="none"
        aria-label={entry.title}
      />
    );
  }

  return (
    <a
      href={video.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-video bg-[var(--bay-stage)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- posters may be remote */}
      <img
        src={video.poster}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
      />
      <span className="text-mono-xs absolute bottom-3 right-3 rounded-sm bg-black/70 px-2 py-1 text-white">
        Watch ↗
      </span>
      <span className="sr-only">Watch {entry.title}</span>
    </a>
  );
}

export function ShowcaseCard({ entry }: { entry: ShowcaseEntry }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-sm border border-[var(--bay-border)] bg-[var(--bay-surface)]">
      <ShowcaseMedia entry={entry} />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-medium tracking-tight">
            {entry.title}
          </h2>
          <span className="text-mono-xs shrink-0 text-fd-muted-foreground">
            {formatDuration(entry.durationSeconds)}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-fd-muted-foreground">
          {entry.description}
        </p>

        {entry.note ? (
          <p className="text-xs text-fd-muted-foreground italic">{entry.note}</p>
        ) : null}

        {entry.components && entry.components.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Components used">
            {entry.components.map((name) => (
              <li key={name}>
                <Link
                  href={`/docs/components/${name}`}
                  className="text-mono-xs inline-block rounded-sm border border-[var(--bay-border)] px-2 py-1 text-fd-muted-foreground transition-colors hover:border-[var(--bay-border-strong)] hover:text-fd-foreground"
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="text-mono-xs mt-auto flex items-center gap-4 pt-2 text-fd-muted-foreground">
          <span>
            by{" "}
            {entry.author.url ? (
              <a
                href={entry.author.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fd-foreground underline underline-offset-4"
              >
                {entry.author.name}
              </a>
            ) : (
              <span className="text-fd-foreground">{entry.author.name}</span>
            )}
          </span>
          {entry.sourceUrl ? (
            <a
              href={entry.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 transition-colors hover:text-fd-foreground"
            >
              Source ↗
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
