import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { Metadata } from "next";
import { InstallStrip } from "@/components/landing/install-strip";
import { EndSlateCta } from "@/components/landing/end-slate-cta";
import { LandingLivePlayground } from "@/components/landing/landing-live-playground";
import { RecipeRail } from "@/components/landing/recipe-rail";
import { StoryboardShowcase } from "@/components/landing/storyboard-showcase";
import { StudioHero } from "@/components/landing/studio-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogo } from "@/components/site-logo";
import { githubStarNavLink } from "@/lib/github-nav-link";
import { navLinks, siteConfig } from "@/lib/site-config";

const title = "RemotionUI – Compositions you own, frame by frame";
const description = `${siteConfig.tagline} ${siteConfig.description}`;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: siteConfig.url,
  },
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function HomePage() {
  return (
    <HomeLayout
      nav={{
        title: <SiteLogo />,
        url: "/",
      }}
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
      <StudioHero />
      <LandingLivePlayground />
      <RecipeRail />
      <StoryboardShowcase />
      <InstallStrip />
      <EndSlateCta />
      <SiteFooter />
    </HomeLayout>
  );
}
