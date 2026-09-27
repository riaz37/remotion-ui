import { siteConfig } from "@/lib/site-config";

/**
 * Videos made with RemotionUI, shown on /showcase.
 *
 * Entries are curated: people submit through the GitHub issue form
 * (SHOWCASE_SUBMIT_URL), and an approved submission is added here by PR.
 * Self-hosted files live in public/showcase/ and must be web-encoded
 * (h264, +faststart, well under 10 MB): public/showcases/*.mp4 is gitignored
 * and never deploys.
 */

export type ShowcaseVideo =
  /** A file we serve: plays inline. */
  | { kind: "file"; src: string; poster: string }
  /** Hosted elsewhere (YouTube, X, a product site): the poster links out. */
  | { kind: "link"; href: string; poster: string };

export type ShowcaseEntry = {
  slug: string;
  title: string;
  description: string;
  author: { name: string; url?: string };
  video: ShowcaseVideo;
  /** Source repo or project page, when the maker shares one. */
  sourceUrl?: string;
  /** Shown under the title, e.g. an unofficial-demo disclaimer. */
  note?: string;
  /** The components it uses, as registry names; linked to their docs. */
  components?: readonly string[];
  durationSeconds: number;
  addedAt: string;
};

export const SHOWCASE_SUBMIT_URL = `${siteConfig.githubUrl}/issues/new?template=showcase.yml`;

const REMOTIONUI_TEAM = { name: "RemotionUI", url: siteConfig.githubUrl } as const;

export const SHOWCASE_ENTRIES: readonly ShowcaseEntry[] = [
  {
    slug: "remotionui-launch",
    title: "RemotionUI launch film",
    description:
      "A 34-second product film shot on real captures of remotionui.com, with registry components rendering live inside it and a frame-locked score.",
    author: REMOTIONUI_TEAM,
    video: {
      kind: "file",
      src: "/showcase/remotionui-launch.mp4",
      poster: "/showcase/remotionui-launch-poster.jpg",
    },
    sourceUrl: `${siteConfig.githubUrl}/tree/main/apps/web/showcase/remotionui-launch`,
    components: ["hero-loop", "intro", "animated-noise-grain", "logo-reveal"],
    durationSeconds: 34,
    addedAt: "2026-09-27",
  },
  {
    slug: "supabase-demo",
    title: "Supabase product demo",
    description:
      "A 48-second product walkthrough built on real dashboard captures: a virtual camera across one canvas, a cursor pinned to the UI, and a synthesized score.",
    author: REMOTIONUI_TEAM,
    note: "Unofficial concept demo. Not made by or affiliated with Supabase.",
    video: {
      kind: "file",
      src: "/showcase/supabase-demo.mp4",
      poster: "/showcase/supabase-demo-poster.jpg",
    },
    sourceUrl: `${siteConfig.githubUrl}/tree/main/apps/web/showcase/supabase-demo`,
    durationSeconds: 48,
    addedAt: "2026-09-27",
  },
];
