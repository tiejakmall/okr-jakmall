import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail, type ReminderType } from "@/lib/email";
import { getSettingsIssues, getCollectionIssues, computeNextRunAfter } from "@/lib/reminder-issues";

export async function GET(req: NextRequest) {
  // Vercel sends Authorization: Bearer <CRON_SECRET>
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  const dueSchedules = await prisma.reminderSchedule.findMany({
    where: { isActive: true, nextRun: { lte: now } },
    include: { quarter: true },
  });

  if (dueSchedules.length === 0) {
    return NextResponse.json({ ran: 0, message: "No schedules due." });
  }

  const leads = await prisma.user.findMany({
    where: { role: "LEAD" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const log: { scheduleId: string; sent: number; skipped: number; errors: number }[] = [];

  for (const schedule of dueSchedules) {
    let sent = 0, skipped = 0, errors = 0;

    for (const lead of leads) {
      if (!lead.email) { errors++; continue; }

      const issues =
        schedule.type === "settings"
          ? await getSettingsIssues(lead.id, schedule.quarterId)
          : await getCollectionIssues(lead.id, schedule.quarterId);

      const isComplete = !issues.hasNoObjectives && issues.objectives.length === 0 && issues.summaryIssues.length === 0;

      if (isComplete) { skipped++; continue; }

      try {
        await sendReminderEmail({
          to: lead.email,
          name: lead.name ?? lead.email,
          type: schedule.type as ReminderType,
          quarterName: schedule.quarter.name,
          quarterId: schedule.quarterId,
          completionIssues: issues,
        });
        sent++;
      } catch {
        errors++;
      }
    }

    // Update schedule: set lastRun and compute next nextRun
    const nextRun = computeNextRunAfter(
      schedule.frequency as "weekly" | "biweekly" | "monthly",
      schedule.dayOfMonth,
      schedule.hourWIB,
      now
    );

    await prisma.reminderSchedule.update({
      where: { id: schedule.id },
      data: { lastRun: now, nextRun },
    });

    log.push({ scheduleId: schedule.id, sent, skipped, errors });
  }

  return NextResponse.json({ ran: dueSchedules.length, log });
}
