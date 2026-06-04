import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReminderManager from "./ReminderManager";
import ScheduleManager from "./ScheduleManager";

export default async function RemindersPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/dashboard");

  const quarters = await prisma.quarter.findMany({
    orderBy: [{ year: "desc" }, { quarter: "desc" }],
    select: { id: true, name: true, isActive: true },
  });

  const activeQuarter = quarters.find((q) => q.isActive) ?? quarters[0];

  const leads = await prisma.user.findMany({
    where: { role: "LEAD" },
    select: { id: true, name: true, email: true, division: true },
    orderBy: { name: "asc" },
  });

  const leadsWithStatus = await Promise.all(
    leads.map(async (lead) => {
      if (!activeQuarter) return { ...lead, name: lead.name ?? "-", email: lead.email ?? "", division: lead.division ?? null, hasOKR: false, hasProgress: false };

      const objectiveCount = await prisma.objective.count({ where: { userId: lead.id, quarterId: activeQuarter.id } });
      const hasOKR = objectiveCount > 0;
      let hasProgress = false;

      if (hasOKR) {
        const objectives = await prisma.objective.findMany({ where: { userId: lead.id, quarterId: activeQuarter.id }, select: { keyResults: { select: { id: true } } } });
        const krIds = objectives.flatMap((o) => o.keyResults.map((kr) => kr.id));
        if (krIds.length > 0) {
          const count = await prisma.kRAssignment.count({ where: { keyResultId: { in: krIds }, progress: { gt: 0 } } });
          hasProgress = count > 0;
        }
      }

      return { id: lead.id, name: lead.name ?? "-", email: lead.email ?? "", division: lead.division ?? null, hasOKR, hasProgress };
    })
  );

  const schedules = await prisma.reminderSchedule.findMany({
    include: { quarter: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 mb-1">📧 Reminder</h1>
        <p className="text-sm text-slate-400">Kirim manual atau atur jadwal otomatis ke semua Lead Divisi.</p>
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Kirim Sekarang</h2>
        <ReminderManager quarters={JSON.parse(JSON.stringify(quarters))} initialLeads={leadsWithStatus} />
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Jadwal Otomatis</h2>
        <ScheduleManager
          quarters={JSON.parse(JSON.stringify(quarters))}
          initialSchedules={JSON.parse(JSON.stringify(schedules))}
        />
      </div>
    </div>
  );
}
