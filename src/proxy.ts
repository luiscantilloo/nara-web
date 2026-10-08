import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "nara_sid";

/** Rutas de página públicas (sin cookie). */
const PUBLIC_PATHS = ["/", "/landing", "/ingreso"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  // La API vive en nara-api (rewrite). Auth y errores los resuelve el gateway Nest.
  if (pathname.startsWith("/api/")) return true;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/opengraph-image" ||
    pathname === "/twitter-image"
  ) {
    return true;
  }
  return false;
}

function hasSignedCookie(value: string | undefined) {
  if (!value) return false;
  return value.split(".").length === 3;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!hasSignedCookie(cookie)) {
    const url = req.nextUrl.clone();
    url.pathname = "/ingreso";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?)$).*)",
  ],
};
