import Link from "next/link";

export function ShowcaseVideoClient({
  src,
  title,
  composition,
  mp4Exists,
}: {
  src: string;
  title: string;
  composition?: string;
  mp4Exists: boolean;
}) {
  const compositionHref = composition
    ? `/docs/compositions/${composition}`
    : undefined;

  return (
    <div className="not-prose my-6 overflow-hidden rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)]">
      <div className="border-b border-fd-border px-4 py-2.5 text-sm font-medium text-fd-foreground">
        {title}
      </div>
      {mp4Exists ? (
        <video
          className="w-full bg-black"
          src={src}
          controls
          playsInline
          preload="metadata"
        />
      ) : (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 bg-black px-6 py-10 text-center text-sm text-fd-muted-foreground">
          <p>Showcase MP4 not generated yet.</p>
          {compositionHref ? (
            <Link
              href={compositionHref}
              className="font-medium text-fd-primary transition-opacity hover:opacity-80"
            >
              Open live preview →
            </Link>
          ) : null}
        </div>
      )}
      <p className="px-4 py-3 text-xs text-fd-muted-foreground">
        {mp4Exists ? (
          "Pre-rendered output."
        ) : (
          <>
            Generate with{" "}
            <code className="font-[family-name:var(--font-mono)]">
              pnpm render:showcases
            </code>
            .
          </>
        )}
      </p>
    </div>
  );
}
