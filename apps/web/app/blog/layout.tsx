import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogo } from "@/components/site-logo";
import { githubStarNavLink } from "@/lib/github-nav-link";
import { navLinks } from "@/lib/site-config";

export default function BlogLayout({ children }: { children: ReactNode }) {
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
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </HomeLayout>
  );
}
