import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail, type ReminderType, type CompletionIssues, type ObjectiveIssue } from "@/lib/email";

async function getSettingsIssues(leadId: string, quarterId: string): Promise<CompletionIssues> {
  const objectives = await prisma.objective.findMany({
    where: { userId: leadId, quarterId },
    select: {
      id: true,
      title: true,
      status: true,
      keyResults: {
        select: {
          id: true,
          title: true,
          weight: true,
          target: true,
          unit: true,
          krAssignments: {
            select: {
              weight: true,
              assignment: { select: { member: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });

  if (objectives.length === 0) return { hasNoObjectives: true, objectives: [] };

  const objectiveIssues: ObjectiveIssue[] = [];

  for (const obj of objectives) {
    const issues: string[] = [];
    if (obj.status === "DRAFT") issues.push("Belum dikumpulkan (masih Draft)");

    // No KRs at all
    if (obj.keyResults.length === 0) {
      issues.push("Belum ada Key Result yang dibuat");
      objectiveIssues.push({ title: obj.title, issues, krIssues: [] });
      continue;
    }

    // Total KR weight check
    const totalWeight = obj.keyResults.reduce((s, kr) => s + kr.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.1) {
      issues.push(`Total bobot KR: ${totalWeight.toFixed(0)}% (harus 100%)`);
    }

    // Per-KR field checks
    const krIssues = obj.keyResults.flatMap((kr) => {
      const krIss: string[] = [];
      if (kr.weight === 0) krIss.push("bobot 0%");
      if (kr.target === 0) krIss.push("target belum diisi");
      if (!kr.unit || kr.unit.trim() === "") krIss.push("satuan belum dipilih");
      return krIss.length > 0 ? [{ title: kr.title, issues: krIss }] : [];
    });

    // Per-member bobot check (sum of KRAssignment weights per member should = 100%)
    const memberWeightMap = new Map<string, number>();
    for (const kr of obj.keyResults) {
      for (const kra of kr.krAssignments) {
        const name = kra.assignment.member.name;
        memberWeightMap.set(name, (memberWeightMap.get(name) ?? 0) + kra.weight);
      }
    }
    for (const [memberName, totalBobot] of memberWeightMap.entries()) {
      if (Math.abs(totalBobot - 100) > 0.1) {
        issues.push(`Bobot ${memberName}: ${totalBobot.toFixed(0)}% (harus 100%)`);
      }
    }

    if (issues.length > 0 || krIssues.length > 0) {
      objectiveIssues.push({ title: obj.title, issues, krIssues });
    }
  }

  return { hasNoObjectives: false, objectives: objectiveIssues };
}

async function getResultsIssues(leadId: string, quarterId: string): Promise<CompletionIssues> {
  const objectives = await prisma.objective.findMany({
    where: { userId: leadId, quarterId },
    select: {
      id: true,
      title: true,
      keyResults: {
        select: {
          id: true,
          title: true,
          krAssignments: {
            select: {
              progress: true,
              assignment: { select: { member: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });

  if (objectives.length === 0) return { hasNoObjectives: true, objectives: [] };

  const objectiveIssues: ObjectiveIssue[] = [];

  for (const obj of objectives) {
    const krIssues = obj.keyResults.flatMap((kr) => {
      const empty = kr.krAssignments.filter((a) => a.progress === 0);
      if (empty.length === 0) return [];
      const names = empty.map((a) => a.assignment.member.name).join(", ");
      return [{ title: kr.title, issues: [`${empty.length} anggota belum isi progress: ${names}`] }];
    });

    if (krIssues.length > 0) {
      objectiveIssues.push({ title: obj.title, issues: [], krIssues });
    }
  }

  return { hasNoObjectives: false, objectives: objectiveIssues };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type, quarterId }: { type: ReminderType; quarterId: string } = await req.json();

  if (!type || !quarterId) {
    return NextResponse.json({ error: "type dan quarterId wajib diisi." }, { status: 400 });
  }

  const quarter = await prisma.quarter.findUnique({ where: { id: quarterId } });
  if (!quarter) {
    return NextResponse.json({ error: "Quarter tidak ditemukan." }, { status: 404 });
  }

  const leads = await prisma.user.findMany({
    where: { role: "LEAD" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  if (leads.length === 0) {
    return NextResponse.json({ error: "Tidak ada Lead Divisi yang terdaftar." }, { status: 404 });
  }

  const results: { name: string; email: string; status: "sent" | "skipped" | "error"; reason?: string; error?: string }[] = [];

  for (const lead of leads) {
    if (!lead.email) {
      results.push({ name: lead.name ?? "-", email: "-", status: "error", error: "Tidak ada email" });
      continue;
    }

    const completionIssues =
      type === "settings"
        ? await getSettingsIssues(lead.id, quarterId)
        : await getResultsIssues(lead.id, quarterId);

    const isComplete = !completionIssues.hasNoObjectives && completionIssues.objectives.length === 0;

    if (isComplete) {
      results.push({ name: lead.name ?? "-", email: lead.email, status: "skipped", reason: "OKR sudah lengkap ✅" });
      continue;
    }

    try {
      await sendReminderEmail({
        to: lead.email,
        name: lead.name ?? lead.email,
        type,
        quarterName: quarter.name,
        quarterId,
        completionIssues,
      });
      results.push({ name: lead.name ?? "-", email: lead.email, status: "sent" });
    } catch (err) {
      results.push({
        name: lead.name ?? "-",
        email: lead.email,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const sentCount = results.filter((r) => r.status === "sent").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;
  const errCount = results.filter((r) => r.status === "error").length;

  const messageParts = [];
  if (sentCount > 0) messageParts.push(`${sentCount} email terkirim`);
  if (skippedCount > 0) messageParts.push(`${skippedCount} sudah lengkap (tidak dikirim)`);
  if (errCount > 0) messageParts.push(`${errCount} gagal`);

  return NextResponse.json({
    success: sentCount > 0 || skippedCount > 0,
    message: messageParts.join(", ") + ".",
    results,
  });
}
