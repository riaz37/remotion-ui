import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { Metadata } from "next";
import { EarlyAccessForm } from "@/components/early-access/early-access-form";
import { kineNavLink } from "@/components/early-access/kine-nav-link";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogo } from "@/components/site-logo";
import { VisitorsThisHour } from "@/components/visitors-this-hour";
import { githubStarNavLink, xNavLink } from "@/lib/github-nav-link";
import { getSponsorTraffic } from "@/lib/sponsor-traffic";
import { navLinks, siteConfig } from "@/lib/site-config";

const title = "Sponsor";
const description =
  "Sponsor RemotionUI: one placement on every component page, seen by developers building videos with React and Remotion.";

// Matches the visitors-this-hour fetch; the 30-day stats keep their own hourly cache.
export const revalidate = 60;

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

export default async function SponsorPage() {
  const traffic = await getSponsorTraffic();

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
        xNavLink,
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

          <div className="mt-12">
            <VisitorsThisHour />
          </div>

          <dl className="mt-4 grid max-w-[720px] gap-px overflow-hidden rounded-sm border border-[var(--bay-border)] bg-[var(--bay-border)] sm:grid-cols-3">
            {traffic.stats.map((stat) => (
              <div key={stat.label} className="bg-[var(--bay-bg)] p-6">
                <dt className="text-mono-xs uppercase text-fd-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="text-display-lg mt-2">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-fd-muted-foreground">
            Last 30 days, from Vercel Web Analytics
            {traffic.live ? ", updated hourly." : "."}
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
        <div className="mx-auto max-w-[1120px] px-6 py-[104px]">
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
        </div>
      </section>

      <SiteFooter />
    </HomeLayout>
  );
}
