import type { Metadata } from "next";
import { ShowcaseCard } from "@/components/showcase/showcase-card";
import { SHOWCASE_ENTRIES, SHOWCASE_SUBMIT_URL } from "@/lib/showcase";
import { siteConfig } from "@/lib/site-config";

const title = "Showcase";
const description =
  "Videos made with RemotionUI: product demos, launch films, and social clips built from the registry. Made one? Submit it.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} · ${siteConfig.name}`,
    description,
    type: "website",
    url: `${siteConfig.url}/showcase`,
  },
  alternates: { canonical: `${siteConfig.url}/showcase` },
};

export default function ShowcasePage() {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-6 py-16 sm:py-24">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-mono-xs uppercase text-[var(--bay-phosphor)]">
            Made with RemotionUI
          </p>
          <h1 className="text-display-lg mt-3">Showcase</h1>
          <p className="mt-3 max-w-xl text-fd-muted-foreground">
            Videos built from the registry. Every one is rendered by Remotion,
            frame by frame, from source the maker owns.
          </p>
        </div>
        <a
          href={SHOWCASE_SUBMIT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center rounded-sm bg-fd-foreground px-4 py-2.5 text-sm font-medium text-fd-background transition-opacity hover:opacity-85"
        >
          Submit your video
        </a>
      </header>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {SHOWCASE_ENTRIES.map((entry) => (
          <ShowcaseCard key={entry.slug} entry={entry} />
        ))}
      </div>

      <section className="mt-20 border-t border-[var(--bay-border)] pt-10">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight">
          Get your video listed
        </h2>
        <ol className="mt-4 flex max-w-2xl list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-fd-muted-foreground">
          <li>
            Build it with at least one RemotionUI component and render it with
            Remotion.
          </li>
          <li>
            Upload it anywhere public: YouTube, X, your own site, or a GitHub
            release.
          </li>
          <li>
            Open the{" "}
            <a
              href={SHOWCASE_SUBMIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fd-foreground underline underline-offset-4"
            >
              submission form
            </a>{" "}
            with the link and the components you used. We review every entry
            and add approved ones here.
          </li>
        </ol>
      </section>
    </div>
  );
}
