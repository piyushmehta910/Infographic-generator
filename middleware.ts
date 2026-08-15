import { NextRequest, NextResponse } from "next/server";

// Public (static/marketing) routes — never gated.
const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/pricing",
  "/blog",
  "/privacy",
  "/terms",
]);

const AUTH_ENABLED =
  (process.env.NEXT_PUBLIC_ENABLE_AUTH || "").toLowerCase() === "true";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only gate dynamic app/API routes when auth is enabled.
  const isProtected =
    pathname.startsWith("/generate") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/dashboard");

  if (!AUTH_ENABLED || !isProtected) {
    return NextResponse.next();
  }

  // Allow Next internals and static assets.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("ifg_token")?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (handled internally)
     * - _next/static, _next/image, _next/data
     * - favicon.ico, robots.txt, sitemap.xml, opengraph-image
     */
    "/((?!_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap.xml|opengraph-image|manifest.json).*)",
],
};
