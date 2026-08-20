"use client";

import type * as PageTree from "fumadocs-core/page-tree";
import { usePathname } from "fumadocs-core/framework";
import { SidebarItem } from "fumadocs-ui/components/sidebar/base";

function normalize(urlOrPath: string): string {
  return urlOrPath.length > 1 && urlOrPath.endsWith("/")
    ? urlOrPath.slice(0, -1)
    : urlOrPath;
}

/**
 * Mirrors the default fumadocs sidebar item, minus viewport prefetching.
 * The component tree lists every registry entry, so the default `prefetch`
 * fires an RSC request per visible link. Hover/touch prefetch still applies.
 */
export function SidebarPageItem({ item }: { item: PageTree.Item }) {
  const pathname = usePathname();

  return (
    <SidebarItem
      href={item.url}
      external={item.external}
      active={normalize(item.url) === normalize(pathname)}
      icon={item.icon}
      prefetch={false}
    >
      {item.name}
    </SidebarItem>
  );
}
