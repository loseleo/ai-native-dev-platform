import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const publicPaths = ["/login", "/setup", "/api/auth"];

function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value,
  );
}

export function proxy(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;

  if (publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  if (!hasSessionCookie(request)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/ai-organization/:path*",
    "/decision-inbox/:path*",
    "/settings/:path*",
  ],
};
