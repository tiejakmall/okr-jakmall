import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, division: rawDivision, role } = await req.json();
  const division = rawDivision?.trim()
    ? rawDivision.trim().replace(/\b\w/g, (c: string) => c.toUpperCase())
    : undefined;

  if (!name?.trim() || !role) {
    return NextResponse.json({ error: "Nama dan role wajib diisi" }, { status: 400 });
  }
  if (!["MEMBER", "LEAD"].includes(role)) {
    return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
  }

  const isLead = role === "LEAD";

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name.trim(),
      division: division || null,
      role,
      hasOnboarded: true,
      isApproved: !isLead,
    },
  });

  return NextResponse.json({ role });
}
