import { I18nProvider } from "fumadocs-ui/contexts/i18n";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { DocsSidebarItem } from "@/components/docs/sidebar-item";
import { SidebarFooter } from "@/components/sidebar-footer";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogo } from "@/components/site-logo";
import { githubStarNavLink } from "@/lib/github-nav-link";
import { componentCount } from "@/lib/registry-facts";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Only overrides the search label; the rest keeps fumadocs defaults. */}
      <I18nProvider translations={{ search: `Search ${componentCount} components` }}>
        <DocsLayout
          tree={source.pageTree}
          nav={{
            title: <SiteLogo />,
            url: "/",
          }}
          links={[githubStarNavLink]}
          searchToggle={{ full: { className: "whitespace-nowrap" } }}
          sidebar={{
            footer: <SidebarFooter />,
            // The component tree lists every registry entry, so viewport
            // prefetching would fire an RSC request per visible link.
            prefetch: false,
            components: { Item: DocsSidebarItem },
          }}
        >
          {children}
        </DocsLayout>
      </I18nProvider>
      <SiteFooter />
    </>
  );
}
