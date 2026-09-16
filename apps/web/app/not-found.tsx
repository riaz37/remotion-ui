import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogo } from "@/components/site-logo";
import { StatusSlate } from "@/components/status-slate";
import { kineNavLink } from "@/components/early-access/kine-nav-link";
import { githubStarNavLink, xNavLink } from "@/lib/github-nav-link";
import { navLinks } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page does not exist.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
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
      <StatusSlate
        code="404"
        title="No frame at this timecode."
        description="The page you asked for is not in the registry. It may have been renamed, or the link may be stale."
        primary={{ label: "Browse components", href: "/docs/components" }}
        secondary={{ label: "Back home", href: "/" }}
      />
      <SiteFooter />
    </HomeLayout>
  );
}
