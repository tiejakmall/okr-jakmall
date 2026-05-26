import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "MEMBER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();

  // Upsert assignment
  const assignment = await prisma.objectiveAssignment.upsert({
    where: { memberId_objectiveId: { memberId: body.memberId, objectiveId: body.objectiveId } },
    update: { weight: Number(body.weight) },
    create: { memberId: body.memberId, objectiveId: body.objectiveId, weight: Number(body.weight) },
    include: { krAssignments: true },
  });

  // Auto-create KR assignments for all KRs in this objective (with equal weights)
  const krs = await prisma.keyResult.findMany({ where: { objectiveId: body.objectiveId } });
  if (krs.length > 0 && assignment.krAssignments.length === 0) {
    const equalWeight = parseFloat((100 / krs.length).toFixed(4));
    await Promise.all(
      krs.map((kr) =>
        prisma.kRAssignment.upsert({
          where: { assignmentId_keyResultId: { assignmentId: assignment.id, keyResultId: kr.id } },
          update: {},
          create: { assignmentId: assignment.id, keyResultId: kr.id, weight: equalWeight },
        })
      )
    );
  }

  // Return assignment with fresh KR assignments
  const result = await prisma.objectiveAssignment.findUnique({
    where: { id: assignment.id },
    include: { krAssignments: true },
  });
  return NextResponse.json(result, { status: 201 });
}
