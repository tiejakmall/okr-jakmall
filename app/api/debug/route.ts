import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({ select: { email: true, role: true } });
    return Response.json({ ok: true, userCount, users, dbUrl: process.env.DATABASE_URL?.slice(0, 40) + "..." });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
