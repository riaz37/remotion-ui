import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { Metadata } from "next";
import { EarlyAccessForm } from "@/components/early-access/early-access-form";
import { earlyAccessCopy } from "@/components/early-access/early-access-copy";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogo } from "@/components/site-logo";
import { PerforationRule } from "@/components/studio/perforation-rule";
import { githubStarNavLink } from "@/lib/github-nav-link";
import { navLinks, siteConfig } from "@/lib/site-config";

const title = "Early access";
const description = earlyAccessCopy.lead;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} · ${siteConfig.name}`,
    description,
    type: "website",
    url: `${siteConfig.url}/early-access`,
  },
  alternates: {
    canonical: `${siteConfig.url}/early-access`,
  },
};

const STAGES = [
  {
    step: "01",
    title: "Point it at your app",
    body: "One command against localhost. A scripted browser session walks the flow you name — your UI, your seed data, nothing leaves the machine.",
  },
  {
    step: "02",
    title: "It cuts the footage",
    body: "Capture becomes a Remotion project: scenes, captions, and timing, built from the components in this registry.",
  },
  {
    step: "03",
    title: "Every frame gets checked",
    body: "Frames are sampled and reviewed before you see the result, so a render that finishes green is not the same as a render that is right.",
  },
  {
    step: "04",
    title: "You keep the source",
    body: "Real TSX in your repo. Edit a scene, re-render, or throw the whole cut away and keep the parts you liked.",
  },
];

export default function EarlyAccessPage() {
  return (
    <HomeLayout
      nav={{ title: <SiteLogo />, url: "/" }}
      links={[
        ...navLinks.map((link) => ({
          text: link.text,
          url: link.url,
          active: link.active,
        })),
        githubStarNavLink,
      ]}
      className="flex flex-1 flex-col"
    >
      <section className="border-b border-[var(--bay-border)]">
        <div className="mx-auto max-w-[1120px] px-6 py-[112px]">
          <p className="text-mono-xs uppercase text-[var(--bay-phosphor)]">
            {earlyAccessCopy.eyebrow}
          </p>
          <h1 className="text-display-xl mt-4 max-w-[16ch]">{earlyAccessCopy.title}</h1>
          <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-fd-muted-foreground">
            {earlyAccessCopy.lead}
          </p>

          <EarlyAccessForm
            source="early-access-page"
            className="mt-9 max-w-lg"
          />
          <p className="mt-3 max-w-[52ch] text-xs leading-relaxed text-fd-muted-foreground">
            {earlyAccessCopy.assurance}
          </p>
        </div>
      </section>

      <section className="relative border-b border-[var(--bay-border)] bg-[var(--bay-surface)]">
        <PerforationRule className="absolute inset-x-0 top-0" />
        <div className="mx-auto max-w-[1120px] px-6 py-[104px]">
          <h2 className="text-display-lg">What the first round covers</h2>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-sm border border-[var(--bay-border)] bg-[var(--bay-border)] sm:grid-cols-2">
            {STAGES.map((stage) => (
              <li
                key={stage.step}
                className="flex flex-col bg-[var(--bay-bg)] p-7"
              >
                <span className="text-mono-xs text-fd-muted-foreground">
                  {stage.step}
                </span>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-lg font-medium tracking-tight">
                  {stage.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
                  {stage.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-[var(--bay-border)]">
        <div className="mx-auto max-w-[1120px] px-6 py-[104px]">
          <h2 className="text-display-lg">Common questions</h2>
          <dl className="mt-10 max-w-[720px] divide-y divide-[var(--bay-border)] border-y border-[var(--bay-border)]">
            {FAQ.map((entry) => (
              <div key={entry.question} className="py-7">
                <dt className="font-medium text-fd-foreground">
                  {entry.question}
                </dt>
                <dd className="mt-2 text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
                  {entry.answer}
                </dd>
              </div>
            ))}
          </dl>

          <EarlyAccessForm
            source="early-access-page"
            className="mt-12 max-w-lg"
          />
        </div>
      </section>

      <SiteFooter />
    </HomeLayout>
  );
}

const FAQ = [
  {
    question: "What does early access cost?",
    answer:
      "Nothing during the first round. Pricing gets decided in the open before anything is charged, and nobody on the list is billed by surprise.",
  },
  {
    question: "Do I need to know Remotion?",
    answer:
      "No. The output is a normal Remotion project, so knowing it helps if you want to hand-edit a scene — but the default path is one command in, one MP4 out.",
  },
  {
    question: "Does my app or data leave my machine?",
    answer:
      "The capture runs locally against your own localhost and your own seed data. Use test data, not a production account.",
  },
  {
    question: "How will you use my email?",
    answer:
      "Once, to tell you your spot is ready. No newsletter, no sharing the list, and unsubscribing is a reply.",
  },
];
