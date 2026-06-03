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

  // If quarterId provided: only remove this member's assignments for that quarter.
  // The TeamMember record itself is kept so other quarters are unaffected.
  const quarterId = req.nextUrl.searchParams.get("quarterId");
  if (quarterId) {
    // Find ObjectiveAssignments for this member in this quarter
    const assignments = await prisma.objectiveAssignment.findMany({
      where: { memberId: id, objective: { quarterId } },
      select: { id: true },
    });
    if (assignments.length > 0) {
      await prisma.objectiveAssignment.deleteMany({
        where: { id: { in: assignments.map((a) => a.id) } },
      });
    }
    return new NextResponse(null, { status: 204 });
  }

  // No quarterId: delete the TeamMember entirely (all quarters) — only used intentionally
  await prisma.teamMember.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
