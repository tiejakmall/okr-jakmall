import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const kr = await prisma.keyResult.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.target !== undefined && { target: Number(body.target) }),
      ...(body.unit !== undefined && { unit: body.unit }),
      ...(body.weight !== undefined && { weight: Number(body.weight) }),
      ...(body.teamProgress !== undefined && { teamProgress: Number(body.teamProgress) }),
      ...("leadProgress" in body && {
        leadProgress: body.leadProgress !== null ? Number(body.leadProgress) : null,
      }),
    },
  });
  return NextResponse.json(kr);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.keyResult.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
