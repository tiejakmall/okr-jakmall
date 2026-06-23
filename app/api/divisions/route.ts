import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const divisions = await prisma.division.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(divisions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nama divisi wajib diisi" }, { status: 400 });

  const normalized = name.trim().replace(/\b\w/g, (c: string) => c.toUpperCase());
  try {
    const division = await prisma.division.create({ data: { name: normalized } });
    return NextResponse.json(division);
  } catch {
    return NextResponse.json({ error: "Nama divisi sudah ada" }, { status: 409 });
  }
}
