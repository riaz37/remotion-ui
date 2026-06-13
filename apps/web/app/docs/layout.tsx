import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { SidebarFooter } from "@/components/sidebar-footer";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogo } from "@/components/site-logo";
import { githubStarNavLink } from "@/lib/github-nav-link";
import { navLinks } from "@/lib/site-config";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <DocsLayout
        tree={source.pageTree}
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
        sidebar={{ footer: <SidebarFooter /> }}
      >
        {children}
      </DocsLayout>
      <SiteFooter />
    </>
  );
}
