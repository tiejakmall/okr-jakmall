import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function norm(s: string): string {
  let out = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    if ([0x200b,0x200c,0x200d,0x200e,0x200f,0x00ad,0xfeff,0x2028,0x2029].includes(cp)) continue;
    if (cp === 0x00a0 || cp === 0x1680 || (cp >= 0x2000 && cp <= 0x200a) || cp === 0x202f || cp === 0x205f || cp === 0x3000) { out += " "; continue; }
    out += ch;
  }
  return out.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().toLowerCase();
}

// GET — preview: how many members/obj/kr exist in the source quarter
export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role === "MEMBER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const fromQuarterId = searchParams.get("fromQuarterId");
  const leadId = searchParams.get("leadId") ?? session.user.id;
  if (!fromQuarterId) return Response.json({ error: "fromQuarterId required" }, { status: 400 });

  const members = await prisma.teamMember.findMany({
    where: { leadId },
    include: {
      assignments: {
        where: { objective: { quarterId: fromQuarterId } },
        include: {
          objective: { select: { title: true } },
          krAssignments: { select: { id: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const preview = members
    .filter((m) => m.assignments.length > 0)
    .map((m) => ({
      name: m.name,
      objectiveCount: m.assignments.length,
      krCount: m.assignments.reduce((s, a) => s + a.krAssignments.length, 0),
      objectives: [...new Set(m.assignments.map((a) => a.objective.title))],
    }));

  return Response.json({ members: preview, total: preview.length });
}

// POST — copy assignments from source quarter to target quarter
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role === "MEMBER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { fromQuarterId, toQuarterId, selectedMemberNames } = body;
  const leadId: string = body.leadId ?? session.user.id;

  if (!fromQuarterId || !toQuarterId) return Response.json({ error: "fromQuarterId dan toQuarterId wajib diisi." }, { status: 400 });

  // Fetch source assignments — optionally filtered to selected member names
  const memberNameFilter = Array.isArray(selectedMemberNames) && selectedMemberNames.length > 0
    ? { name: { in: selectedMemberNames as string[] } }
    : {};

  const sourceMembers = await prisma.teamMember.findMany({
    where: { leadId, ...memberNameFilter },
    include: {
      assignments: {
        where: { objective: { quarterId: fromQuarterId } },
        include: {
          objective: true,
          krAssignments: { include: { keyResult: true } },
        },
      },
    },
  });

  // Fetch target quarter objectives + KRs
  const targetObjectives = await prisma.objective.findMany({
    where: { userId: leadId, quarterId: toQuarterId },
    include: { keyResults: true },
  });

  if (targetObjectives.length === 0) {
    return Response.json({ error: "Quarter tujuan belum punya objective. Buat OKR Divisi dulu sebelum menyalin distribusi." }, { status: 400 });
  }

  const targetObjMap = new Map(targetObjectives.map((o) => [norm(o.title), o]));
  const targetKrMap = new Map(
    targetObjectives.flatMap((o) => o.keyResults.map((kr) => [`${o.id}::${norm(kr.title)}`, kr]))
  );

  let copiedAssignments = 0, copiedKRAs = 0;
  const errors: string[] = [];

  for (const member of sourceMembers) {
    if (member.assignments.length === 0) continue;

    for (const srcAssignment of member.assignments) {
      const targetObj = targetObjMap.get(norm(srcAssignment.objective.title))
        ?? targetObjectives.find((o) => {
          const on = norm(o.title);
          const sn = norm(srcAssignment.objective.title);
          return on.includes(sn) || sn.includes(on);
        });

      if (!targetObj) {
        errors.push(`Objective "${srcAssignment.objective.title}" tidak ditemukan di quarter tujuan (judul berbeda).`);
        continue;
      }

      let targetAssignment;
      try {
        targetAssignment = await prisma.objectiveAssignment.upsert({
          where: { memberId_objectiveId: { memberId: member.id, objectiveId: targetObj.id } },
          create: { memberId: member.id, objectiveId: targetObj.id, weight: srcAssignment.weight },
          update: { weight: srcAssignment.weight },
        });
        copiedAssignments++;
      } catch (e) {
        errors.push(`Assignment ${member.name} → "${srcAssignment.objective.title}": ${String(e)}`);
        continue;
      }

      for (const srcKra of srcAssignment.krAssignments) {
        const krKey = `${targetObj.id}::${norm(srcKra.keyResult.title)}`;
        const targetKr = targetKrMap.get(krKey)
          ?? targetObj.keyResults.find((k) => {
            const kn = norm(k.title);
            const sn = norm(srcKra.keyResult.title);
            return kn.includes(sn) || sn.includes(kn);
          });

        if (!targetKr) {
          errors.push(`KR "${srcKra.keyResult.title}" tidak ditemukan di "${targetObj.title}".`);
          continue;
        }

        try {
          await prisma.kRAssignment.upsert({
            where: { assignmentId_keyResultId: { assignmentId: targetAssignment.id, keyResultId: targetKr.id } },
            create: { assignmentId: targetAssignment.id, keyResultId: targetKr.id, weight: srcKra.weight, progress: 0, target: srcKra.target },
            update: { weight: srcKra.weight, target: srcKra.target },
          });
          copiedKRAs++;
        } catch (e) {
          errors.push(`KRA ${member.name} → "${srcKra.keyResult.title}": ${String(e)}`);
        }
      }
    }
  }

  return Response.json({
    success: true,
    message: `Berhasil menyalin ${copiedAssignments} assignment (${copiedKRAs} KR) dari quarter sebelumnya. Progress yang sudah diisi tetap terjaga.`,
    errors: errors.length > 0 ? errors : undefined,
  });
}
