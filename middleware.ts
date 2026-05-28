import { NextRequest, NextResponse } from "next/server";

// Minimal middleware — auth protection handled by app/(app)/layout.tsx via auth()
// This avoids Edge Runtime / cookie-name issues while keeping the matcher config
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
