import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getComponentDocPath } from "@/lib/component-doc-path";

export function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/docs\/primitives\/([^/]+)$/);
  if (!match) return NextResponse.next();

  const slug = decodeURIComponent(match[1] ?? "");
  const canonical = getComponentDocPath(slug);
  const legacy = `/docs/primitives/${slug}`;

  if (canonical !== legacy) {
    return NextResponse.redirect(new URL(canonical, request.url), 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/docs/primitives/:slug",
};
