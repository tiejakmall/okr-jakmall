import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const allCookies = req.cookies.getAll();
  const cookieNames = allCookies.map((c) => c.name).join(", ");
  console.log(`[middleware] ${req.method} ${req.nextUrl.pathname} | cookies: ${cookieNames || "(none)"}`);

  const sessionCookie =
    req.cookies.get("__Secure-authjs.session-token") ??
    req.cookies.get("authjs.session-token");
  const isLoggedIn = !!sessionCookie?.value;

  console.log(`[middleware] isLoggedIn=${isLoggedIn} sessionCookie=${sessionCookie?.name ?? "none"}`);

  const { pathname } = req.nextUrl;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth");

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/debug).*)"],
};
