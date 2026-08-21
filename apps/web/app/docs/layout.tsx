import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { SidebarFooter } from "@/components/sidebar-footer";
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
          // The component tree lists every registry entry, so viewport
          // prefetching would fire an RSC request per visible link.
          prefetch: false,
        }}
      >
        {children}
      </DocsLayout>
      <SiteFooter />
    </>
  );
}
