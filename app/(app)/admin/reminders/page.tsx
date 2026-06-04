import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReminderManager from "./ReminderManager";

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
    select: {
      id: true,
      name: true,
      email: true,
      division: true,
    },
    orderBy: { name: "asc" },
  });

  // For each lead, check if they have OKR and progress in the active quarter
  const leadsWithStatus = await Promise.all(
    leads.map(async (lead) => {
      if (!activeQuarter) {
        return { ...lead, hasOKR: false, hasProgress: false };
      }

      const objectiveCount = await prisma.objective.count({
        where: { userId: lead.id, quarterId: activeQuarter.id },
      });

      const hasOKR = objectiveCount > 0;

      let hasProgress = false;
      if (hasOKR) {
        const objectives = await prisma.objective.findMany({
          where: { userId: lead.id, quarterId: activeQuarter.id },
          select: { keyResults: { select: { id: true } } },
        });
        const krIds = objectives.flatMap((o) => o.keyResults.map((kr) => kr.id));
        if (krIds.length > 0) {
          const assignmentCount = await prisma.kRAssignment.count({
            where: { keyResultId: { in: krIds }, progress: { gt: 0 } },
          });
          hasProgress = assignmentCount > 0;
        }
      }

      return {
        id: lead.id,
        name: lead.name ?? "-",
        email: lead.email ?? "",
        division: lead.division ?? null,
        hasOKR,
        hasProgress,
      };
    })
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">📧 Kirim Reminder</h1>
      <ReminderManager
        quarters={JSON.parse(JSON.stringify(quarters))}
        initialLeads={leadsWithStatus}
      />
    </div>
  );
}
