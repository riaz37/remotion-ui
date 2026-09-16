/**
 * The launch film: one real run of the desktop app, told in the frames it
 * actually produced: brief, run, a real video of a real site, pick one
 * element, say what to change, the change lands with the file and lines it
 * touched.
 *
 * The MP4 is a build input, not a fetch: `showcase/launch-film/` renders it to
 * `public/kine-launch-film.mp4` via `npm run render:launch-film`. It carries no
 * audio, which is why it can autoplay muted without taking the page over.
 */
export function KineFilm({ className = "" }: { className?: string }) {
  return (
    <figure
      className={`not-prose overflow-hidden rounded-sm border border-[var(--bay-border)] bg-[var(--bay-surface)] ${className}`}
    >
      <video
        className="block w-full bg-black"
        src="/kine-launch-film.mp4"
        poster="/kine-launch-film-poster.jpg"
        // No soundtrack, so this is silent by construction rather than by a
        // muted flag the viewer has to undo.
        muted
        autoPlay
        loop
        playsInline
        controls
        preload="metadata"
        aria-label="A run of Kine: a written brief becomes a video of a real site, then one element is picked and changed."
      />
      <figcaption className="px-4 py-3 text-xs leading-relaxed text-fd-muted-foreground">
        One real run. Every screen is a screenshot of it; the minutes it spent
        working are cut, and the cuts say so.
      </figcaption>
    </figure>
  );
}
