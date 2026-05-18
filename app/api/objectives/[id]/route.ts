import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const objective = await prisma.objective.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.weight !== undefined && { weight: Number(body.weight) }),
    },
  });
  return NextResponse.json(objective);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.objective.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
