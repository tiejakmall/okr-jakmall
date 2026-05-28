import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const session = await auth();
    return Response.json({
      ok: true,
      userCount,
      session: session ? { email: session.user.email, role: session.user.role } : null,
      env: {
        AUTH_URL: process.env.AUTH_URL ?? "(not set)",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "(not set)",
        VERCEL_URL: process.env.VERCEL_URL ?? "(not set)",
        NODE_ENV: process.env.NODE_ENV,
      },
    });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
