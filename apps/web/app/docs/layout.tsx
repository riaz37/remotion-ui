import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { SidebarFooter } from "@/components/sidebar-footer";
import { SidebarPageItem } from "@/components/docs/sidebar-page-item";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogo } from "@/components/site-logo";
import { githubStarNavLink } from "@/lib/github-nav-link";
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
        links={[githubStarNavLink]}
        sidebar={{
          footer: <SidebarFooter />,
          components: { Item: SidebarPageItem },
        }}
      >
        {children}
      </DocsLayout>
      <SiteFooter />
    </>
  );
}
