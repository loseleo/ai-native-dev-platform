import { NextResponse } from "next/server";

export function proxy() {
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
