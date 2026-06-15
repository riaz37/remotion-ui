import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getComponentDocPath } from "@/lib/component-doc-path";

const LEGACY_SECTIONS = [
  "primitives",
  "signals",
  "vectors",
  "spatial",
  "cuts",
  "scenes",
  "compositions",
  "utilities",
] as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  for (const section of LEGACY_SECTIONS) {
    const match = pathname.match(new RegExp(`^/docs/${section}/([^/]+)$`));
    if (!match) continue;

    const slug = decodeURIComponent(match[1] ?? "");
    const canonical = getComponentDocPath(slug);
    const legacy = `/docs/${section}/${slug}`;

    if (canonical !== legacy) {
      return NextResponse.redirect(new URL(canonical, request.url), 308);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/docs/primitives/:slug",
    "/docs/signals/:slug",
    "/docs/vectors/:slug",
    "/docs/spatial/:slug",
    "/docs/cuts/:slug",
    "/docs/scenes/:slug",
    "/docs/compositions/:slug",
    "/docs/utilities/:slug",
  ],
};
