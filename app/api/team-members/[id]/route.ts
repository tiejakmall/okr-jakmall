import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "MEMBER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const member = await prisma.teamMember.update({ where: { id }, data: { name: body.name } });
  return NextResponse.json(member);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "MEMBER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  // quarterId is REQUIRED — we never delete the TeamMember record itself from this endpoint.
  const quarterId = req.nextUrl.searchParams.get("quarterId");
  if (!quarterId) {
    return NextResponse.json(
      { error: "quarterId wajib diisi. Hapus anggota hanya bisa dilakukan per-quarter." },
      { status: 400 }
    );
  }

  // Ambil semua assignment member ini, filter yang sesuai quarter ini saja
  const allAssignments = await prisma.objectiveAssignment.findMany({
    where: { memberId: id },
    select: { id: true, objective: { select: { quarterId: true } } },
  });

  const toDelete = allAssignments
    .filter((a) => a.objective.quarterId === quarterId)
    .map((a) => a.id);

  if (toDelete.length > 0) {
    await prisma.objectiveAssignment.deleteMany({ where: { id: { in: toDelete } } });
  }

  return new NextResponse(null, { status: 204 });
}
