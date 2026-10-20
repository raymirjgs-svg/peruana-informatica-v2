import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = new Set(["/admin/login", "/account/login", "/account/register"]);

export async function middleware(req: NextRequest) {
  const { pathname: rawPathname } = req.nextUrl;
  const pathname = rawPathname.replace(/\/+$/, "") || "/";

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const signInPath = pathname.startsWith("/account") ? "/account/login" : "/admin/login";
    const url = new URL(signInPath, req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin")) {
    const role = String(token.role ?? "");
    if (role !== "admin" && role !== "super-admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
