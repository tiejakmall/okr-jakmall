import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcUserAchievement, calcObjectiveAchievement, calcMemberAchievement } from "@/lib/calculations";
import LeadOverride from "./LeadOverride";

function ProgressBar({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const color = value >= 100 ? "bg-green-500" : value >= 70 ? "bg-yellow-400" : "bg-red-400";
  const h = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className={`${h} bg-gray-100 rounded-full overflow-hidden`}>
      <div className={`${h} ${color} rounded-full`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function Badge({ value }: { value: number }) {
  const bg = value >= 100 ? "bg-green-500 text-white" : value >= 70 ? "bg-yellow-400 text-gray-900" : "bg-red-400 text-white";
  return <span className={`${bg} text-xs font-bold px-2 py-0.5 rounded-full`}>{value.toFixed(1)}%</span>;
}

function StatusBadge({ status }: { status: string }) {
  return status === "SUBMITTED"
    ? <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">Terkumpul</span>
    : <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">Draft</span>;
}

async function LeadDashboard({ leadId, quarterName, title }: { leadId: string; quarterName: string; title: string }) {
  const objectives = await prisma.objective.findMany({
    where: { userId: leadId },
    include: { keyResults: true },
    orderBy: { createdAt: "asc" },
  });

  const members = await prisma.teamMember.findMany({
    where: { leadId },
    include: {
      assignments: { include: { krAssignments: true } },
    },
    orderBy: { name: "asc" },
  });

  const divAchievement = members.length > 0
    ? members.reduce((s, m) => s + calcMemberAchievement(m.assignments, objectives), 0) / members.length
    : calcUserAchievement(objectives);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{quarterName}</p>
        </div>
        <div className="bg-yellow-400 rounded-2xl px-6 py-3 text-center">
          <p className="text-xs font-semibold text-gray-700">Pencapaian Divisi</p>
          <p className="text-3xl font-bold text-gray-900">{divAchievement.toFixed(2)}%</p>
        </div>
      </div>

      {/* Objectives overview */}
      <div className="space-y-3">
        {objectives.map((obj) => {
          const oa = calcObjectiveAchievement(obj);
          return (
            <div key={obj.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{obj.title}</h3>
                <Badge value={oa} />
              </div>
              <ProgressBar value={oa} />
              <div className="mt-3 space-y-2">
                {obj.keyResults.map((kr) => (
                  <LeadOverride key={kr.id} kr={JSON.parse(JSON.stringify(kr))} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-member achievement */}
      {members.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-700 text-sm">Pencapaian per Anggota</h2>
          </div>
          <div className="divide-y">
            {members.map((m) => {
              const achievement = calcMemberAchievement(m.assignments, objectives);
              return (
                <div key={m.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-xs">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800 text-sm">{m.name}</span>
                    </div>
                    <Badge value={achievement} />
                  </div>
                  <ProgressBar value={achievement} size="sm" />
                  <div className="mt-1.5 pl-9 flex flex-wrap gap-x-3 gap-y-0.5">
                    {m.assignments.map((a) => {
                      const obj = objectives.find((o) => o.id === a.objectiveId);
                      return obj ? (
                        <span key={a.id} className="text-xs text-gray-400">
                          {obj.title} <span className="text-gray-500 font-medium">{a.weight}%</span>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const activeQuarter = await prisma.quarter.findFirst({ where: { isActive: true } });

  if (!activeQuarter) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-700">
          Belum ada quarter aktif. Minta Admin untuk mengaktifkan quarter.
        </div>
      </div>
    );
  }

  /* ─── ADMIN ─── */
  if (session!.user.role === "ADMIN") {
    const leads = await prisma.user.findMany({
      where: { role: "LEAD" },
      orderBy: { name: "asc" },
    });
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Semua Divisi</h1>
          <p className="text-gray-500 text-sm">{activeQuarter.name}</p>
        </div>
        {leads.map((lead) => (
          <div key={lead.id} className="border-t pt-6">
            <LeadDashboard
              leadId={lead.id}
              quarterName={activeQuarter.name}
              title={lead.division ?? lead.name}
            />
          </div>
        ))}
        {leads.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-gray-500">
            Belum ada Lead Divisi. Tambahkan di Admin → Pengguna.
          </div>
        )}
      </div>
    );
  }

  /* ─── LEAD ─── */
  if (session!.user.role === "LEAD") {
    return (
      <LeadDashboard
        leadId={session!.user.id}
        quarterName={activeQuarter.name}
        title={`Dashboard — ${session!.user.division ?? "Divisi Saya"}`}
      />
    );
  }

  /* ─── MEMBER ─── */
  const myObjectives = await prisma.objective.findMany({
    where: { userId: session!.user.id, quarterId: activeQuarter.id },
    include: { keyResults: true },
    orderBy: { createdAt: "asc" },
  });
  const myAchievement = calcUserAchievement(myObjectives);
  const allSubmitted = myObjectives.length > 0 && myObjectives.every((o) => o.status === "SUBMITTED");

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Saya</h1>
          <p className="text-gray-500 text-sm">{activeQuarter.name}</p>
        </div>
        <div className="bg-yellow-400 rounded-2xl px-6 py-3 text-center">
          <p className="text-xs font-semibold text-gray-700">Pencapaian OKR</p>
          <p className="text-3xl font-bold text-gray-900">{myAchievement.toFixed(2)}%</p>
        </div>
      </div>
      {allSubmitted ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-medium">
          ✓ OKR kamu sudah dikumpulkan.
        </div>
      ) : myObjectives.length > 0 ? (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-orange-700 text-sm">
          OKR belum dikumpulkan. <a href="/okr" className="underline font-semibold">Kumpulkan →</a>
        </div>
      ) : null}
      {myObjectives.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-blue-700">
          Belum ada OKR. <a href="/okr" className="underline font-semibold">Isi OKR sekarang →</a>
        </div>
      ) : (
        <div className="space-y-3">
          {myObjectives.map((obj) => {
            const oa = calcObjectiveAchievement(obj);
            return (
              <div key={obj.id} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="font-semibold text-gray-800 truncate">{obj.title}</h2>
                    <StatusBadge status={obj.status} />
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs text-gray-400">Bobot {obj.weight}%</span>
                    <Badge value={oa} />
                  </div>
                </div>
                <ProgressBar value={oa} />
                <div className="mt-3 space-y-2">
                  {obj.keyResults.map((kr) => {
                    const progress = kr.leadProgress ?? kr.teamProgress;
                    const pct = kr.target > 0 ? Math.min((progress / kr.target) * 100, 100) : 0;
                    return (
                      <div key={kr.id} className="text-sm">
                        <div className="flex justify-between text-gray-600 mb-1">
                          <span className="truncate">{kr.title}</span>
                          <span className="font-medium ml-2 flex-shrink-0">
                            {progress}/{kr.target} {kr.unit} · {pct.toFixed(0)}%
                            {kr.leadProgress !== null && <span className="text-blue-500 ml-1">(lead)</span>}
                          </span>
                        </div>
                        <ProgressBar value={pct} size="sm" />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
