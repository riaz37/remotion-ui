import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { Metadata } from "next";
import { EarlyAccessForm } from "@/components/early-access/early-access-form";
import { kineNavLink } from "@/components/early-access/kine-nav-link";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogo } from "@/components/site-logo";
import { githubStarNavLink } from "@/lib/github-nav-link";
import { navLinks, siteConfig } from "@/lib/site-config";

const title = "Sponsor";
const description =
  "Sponsor RemotionUI: one placement on every component page, seen by developers building videos with React and Remotion.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} · ${siteConfig.name}`,
    description,
    type: "website",
    url: `${siteConfig.url}/sponsor`,
  },
  alternates: { canonical: `${siteConfig.url}/sponsor` },
};

/**
 * Vercel Web Analytics, production, 30 days to 2026-09-15. Hand-copied, so
 * refresh these when pitching — a sponsor will compare them to a screenshot.
 */
const TRAFFIC = {
  period: "Last 30 days",
  stats: [
    { label: "Visitors", value: "2,187" },
    { label: "Page views", value: "25,886" },
    { label: "Pages per visit", value: "~12" },
  ],
};

const OFFER = [
  {
    title: "One slot, no rotation",
    body: "Your logo and one line on every component page, plus the README on GitHub. You are the only sponsor shown.",
  },
  {
    title: "A focused audience",
    body: "People reading install commands and prop tables for video components: React developers mid-build, not casual browsers.",
  },
  {
    title: "Monthly, cancel anytime",
    body: "Billed monthly. We agree the price up front and share the traffic numbers each month.",
  },
];

export default function SponsorPage() {
  return (
    <HomeLayout
      nav={{ title: <SiteLogo />, url: "/" }}
      links={[
        ...navLinks.map((link) => ({
          text: link.text,
          url: link.url,
          active: link.active,
        })),
        kineNavLink,
        githubStarNavLink,
      ]}
      className="flex flex-1 flex-col"
    >
      <section className="border-b border-[var(--bay-border)]">
        <div className="mx-auto max-w-[1120px] px-6 py-[112px]">
          <p className="text-mono-xs uppercase text-[var(--bay-phosphor)]">
            Sponsor RemotionUI
          </p>
          <h1 className="text-display-xl mt-4 max-w-[18ch]">
            Reach developers who make video with code
          </h1>
          <p className="mt-5 max-w-[56ch] text-base leading-relaxed text-fd-muted-foreground">
            RemotionUI is a free, MIT-licensed registry of Remotion components.
            Sponsorship keeps it free and keeps new components shipping.
          </p>

          <dl className="mt-12 grid max-w-[720px] gap-px overflow-hidden rounded-sm border border-[var(--bay-border)] bg-[var(--bay-border)] sm:grid-cols-3">
            {TRAFFIC.stats.map((stat) => (
              <div key={stat.label} className="bg-[var(--bay-bg)] p-6">
                <dt className="text-mono-xs uppercase text-fd-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="text-display-lg mt-2">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-fd-muted-foreground">
            {TRAFFIC.period}, from Vercel Web Analytics.
          </p>
        </div>
      </section>

      <section className="border-b border-[var(--bay-border)] bg-[var(--bay-surface)]">
        <div className="mx-auto max-w-[1120px] px-6 py-[104px]">
          <h2 className="text-display-lg">What a sponsor gets</h2>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-sm border border-[var(--bay-border)] bg-[var(--bay-border)] md:grid-cols-3">
            {OFFER.map((item) => (
              <li key={item.title} className="bg-[var(--bay-bg)] p-7">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-medium tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-[var(--bay-border)]">
        <div className="mx-auto grid max-w-[1120px] gap-12 px-6 py-[104px] md:grid-cols-2">
          <div>
            <h2 className="text-display-lg">Sponsoring as a company</h2>
            <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
              Leave a work email and we&apos;ll reply within two days with
              pricing and the current numbers.
            </p>
            <EarlyAccessForm
              source="sponsor-inquiry"
              submitLabel="Request details"
              successCopy="Thanks. We'll email you within two days."
              className="mt-6 max-w-lg"
            />
          </div>
          <div>
            <h2 className="text-display-lg">Supporting as a person</h2>
            <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
              Using RemotionUI in your own projects? Any amount on GitHub
              Sponsors helps pay for hosting and render time.
            </p>
            <a
              href={siteConfig.sponsorsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex w-fit items-center rounded-sm bg-fd-foreground px-5 py-2.5 text-sm font-medium text-fd-background transition-opacity hover:opacity-90"
            >
              Sponsor on GitHub
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </HomeLayout>
  );
}
