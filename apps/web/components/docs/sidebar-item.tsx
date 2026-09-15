"use client";

import type * as PageTree from "fumadocs-core/page-tree";
import {
  SidebarItem as BaseSidebarItem,
  useFolderDepth,
} from "fumadocs-ui/components/sidebar/base";
import { usePathname } from "next/navigation";

/** Page tree item with the `new` flag copied from frontmatter in lib/source. */
export type BadgedItem = PageTree.Item & { new?: boolean };

// Mirrors fumadocs-ui's docs sidebar item styling (itemVariants "link"), which
// the package does not export.
const ITEM_CLASS =
  "relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground wrap-anywhere [&_svg]:size-4 [&_svg]:shrink-0 transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80 hover:transition-none data-[active=true]:bg-fd-primary/10 data-[active=true]:text-fd-primary data-[active=true]:hover:transition-colors";
const NESTED_CLASS =
  "data-[active=true]:before:content-[''] data-[active=true]:before:bg-fd-primary data-[active=true]:before:absolute data-[active=true]:before:w-px data-[active=true]:before:inset-y-2.5 data-[active=true]:before:inset-s-2.5";

function normalize(url: string): string {
  return url.length > 1 && url.endsWith("/") ? url.slice(0, -1) : url;
}

export function DocsSidebarItem({ item }: { item: PageTree.Item }) {
  const pathname = usePathname();
  const depth = useFolderDepth();
  const badged = item as BadgedItem;

  return (
    <BaseSidebarItem
      href={item.url}
      external={item.external}
      active={normalize(pathname) === normalize(item.url)}
      icon={item.icon}
      className={depth >= 1 ? `${ITEM_CLASS} ${NESTED_CLASS}` : ITEM_CLASS}
      style={{ paddingInlineStart: `calc(${2 + 3 * depth} * var(--spacing))` }}
    >
      {item.name}
      {badged.new ? (
        <span className="ms-auto shrink-0 rounded-sm border border-[var(--bay-phosphor)]/40 px-1.5 py-px font-[family-name:var(--font-mono)] text-[0.625rem] uppercase leading-4 tracking-wide text-[var(--bay-phosphor)]">
          New
        </span>
      ) : null}
    </BaseSidebarItem>
  );
}
