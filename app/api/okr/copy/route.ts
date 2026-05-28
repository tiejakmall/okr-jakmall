import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/okr/copy
// Copy objectives (+ key results) from one quarter to another for the current user
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fromQuarterId, toQuarterId, objectiveIds } = await req.json();
  if (!fromQuarterId || !toQuarterId) {
    return NextResponse.json({ error: "fromQuarterId and toQuarterId required" }, { status: 400 });
  }

  // Fetch source objectives for current user
  const sourceObjs = await prisma.objective.findMany({
    where: {
      quarterId: fromQuarterId,
      userId: session.user.id,
      ...(objectiveIds?.length ? { id: { in: objectiveIds } } : {}),
    },
    include: { keyResults: true },
    orderBy: { createdAt: "asc" },
  });

  if (sourceObjs.length === 0) {
    return NextResponse.json({ error: "Tidak ada objective yang bisa diimpor" }, { status: 404 });
  }

  // Create new objectives + key results in target quarter
  const created = await Promise.all(
    sourceObjs.map((obj) =>
      prisma.objective.create({
        data: {
          title: obj.title,
          weight: obj.weight,
          status: "DRAFT",
          userId: session.user.id,
          quarterId: toQuarterId,
          keyResults: {
            create: obj.keyResults.map((kr) => ({
              title: kr.title,
              target: kr.target,
              unit: kr.unit,
              weight: kr.weight,
              teamProgress: 0,
              leadProgress: null,
            })),
          },
        },
        include: { keyResults: true },
      })
    )
  );

  return NextResponse.json(created, { status: 201 });
}
