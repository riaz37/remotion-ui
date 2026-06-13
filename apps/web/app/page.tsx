import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { Metadata } from "next";
import { FeaturedCompositions } from "@/components/featured-compositions";
import { HeroSection } from "@/components/hero-section";
import { OnboardingSteps } from "@/components/onboarding-steps";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogo } from "@/components/site-logo";
import { githubStarNavLink } from "@/lib/github-nav-link";
import { navLinks, siteConfig } from "@/lib/site-config";

const title = "RemotionUI – Production-ready motion for Remotion";
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
      <HeroSection />
      <FeaturedCompositions />
      <OnboardingSteps />
      <SiteFooter />
    </HomeLayout>
  );
}
