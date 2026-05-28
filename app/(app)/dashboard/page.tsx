import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import DivisionView from "./DivisionView";
import IndividualView from "./IndividualView";
import MemberDashboard from "./MemberDashboard";
import DashboardTabs from "./DashboardTabs";

export default async function DashboardPage() {
  const session = await auth();
  const role = session!.user.role;

  const quarters = await prisma.quarter.findMany({
    orderBy: [{ year: "desc" }, { quarter: "desc" }],
    select: { id: true, name: true, isActive: true },
  });

  /* ─── MEMBER ─── */
  if (role === "MEMBER") {
    const activeQuarter = quarters.find((q) => q.isActive) ?? quarters[0];
    const myObjectives = activeQuarter
      ? await prisma.objective.findMany({
          where: { userId: session!.user.id, quarterId: activeQuarter.id },
          include: { keyResults: true },
          orderBy: { createdAt: "asc" },
        })
      : [];
    return (
      <MemberDashboard
        quarters={JSON.parse(JSON.stringify(quarters))}
        userId={session!.user.id}
        initialObjectives={JSON.parse(JSON.stringify(myObjectives))}
        initialQuarterId={activeQuarter?.id ?? ""}
      />
    );
  }

  /* ─── LEAD ─── */
  if (role === "LEAD") {
    const members = await prisma.teamMember.findMany({
      where: { leadId: session!.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return (
      <DashboardTabs
        title={session!.user.division ?? "Divisi Saya"}
        quarters={JSON.parse(JSON.stringify(quarters))}
        members={JSON.parse(JSON.stringify(members))}
        leadId={session!.user.id}
      />
    );
  }

  /* ─── ADMIN ─── */
  const leads = await prisma.user.findMany({
    where: { role: "LEAD" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, division: true },
  });

  if (leads.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-slate-900">📊 Dashboard Admin</h1>
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-2">👥</div>
          <p className="text-slate-500 text-sm">Belum ada Lead Divisi. Tambahkan di Admin → Pengguna.</p>
        </div>
      </div>
    );
  }

  // Admin sees each division with its own tabs
  const allMembersByLead: Record<string, { id: string; name: string }[]> = {};
  for (const lead of leads) {
    const mems = await prisma.teamMember.findMany({
      where: { leadId: lead.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    allMembersByLead[lead.id] = mems;
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-bold text-slate-900">📊 Dashboard Semua Divisi</h1>
      </div>
      {leads.map((lead) => (
        <div key={lead.id} className="border-t border-slate-200 pt-8">
          <DashboardTabs
            title={lead.division ?? lead.name}
            quarters={JSON.parse(JSON.stringify(quarters))}
            members={JSON.parse(JSON.stringify(allMembersByLead[lead.id] ?? []))}
            leadId={lead.id}
          />
        </div>
      ))}
    </div>
  );
}
