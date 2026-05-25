import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcUserAchievement, calcObjectiveAchievement } from "@/lib/calculations";

function ProgressBar({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const color = value >= 100 ? "bg-green-500" : value >= 70 ? "bg-yellow-400" : "bg-red-400";
  const h = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className={`${h} bg-gray-100 rounded-full overflow-hidden`}>
      <div className={`${h} ${color} rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
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

  /* ─── ADMIN VIEW ─── */
  if (session!.user.role === "ADMIN") {
    const allUsers = await prisma.user.findMany({
      include: {
        objectives: {
          where: { quarterId: activeQuarter.id },
          include: { keyResults: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const submitted = allUsers.filter((u) => u.objectives.length > 0 && u.objectives.every((o) => o.status === "SUBMITTED"));
    const notSubmitted = allUsers.filter((u) => u.objectives.length === 0 || u.objectives.some((o) => o.status === "DRAFT"));
    const divisionAchievement = allUsers.length > 0
      ? allUsers.reduce((s, u) => s + calcUserAchievement(u.objectives), 0) / allUsers.length
      : 0;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Divisi</h1>
            <p className="text-gray-500 text-sm mt-0.5">{activeQuarter.name}</p>
          </div>
          <div className="bg-yellow-400 rounded-2xl px-6 py-3 text-center">
            <p className="text-xs font-semibold text-gray-700">Pencapaian OKR Divisi</p>
            <p className="text-3xl font-bold text-gray-900">{divisionAchievement.toFixed(2)}%</p>
          </div>
        </div>

        {/* Pengumpulan status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="text-2xl font-bold text-green-700">{submitted.length}</p>
            <p className="text-sm text-green-600 font-medium">Sudah Kumpulkan OKR</p>
            <div className="mt-2 space-y-1">
              {submitted.map((u) => (
                <p key={u.id} className="text-xs text-green-600">✓ {u.name}</p>
              ))}
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <p className="text-2xl font-bold text-orange-600">{notSubmitted.length}</p>
            <p className="text-sm text-orange-600 font-medium">Belum Kumpulkan OKR</p>
            <div className="mt-2 space-y-1">
              {notSubmitted.map((u) => (
                <p key={u.id} className="text-xs text-orange-600">○ {u.name}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Tabel per orang */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-700 text-sm">Detail Pencapaian per Individu</h2>
          </div>
          <div className="divide-y">
            {allUsers.map((user) => {
              const achievement = calcUserAchievement(user.objectives);
              const allDone = user.objectives.length > 0 && user.objectives.every((o) => o.status === "SUBMITTED");
              return (
                <div key={user.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.division ?? "–"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={allDone ? "SUBMITTED" : "DRAFT"} />
                      <Badge value={achievement} />
                    </div>
                  </div>
                  <ProgressBar value={achievement} />

                  {/* Per-objective breakdown */}
                  {user.objectives.length > 0 && (
                    <div className="mt-3 space-y-1.5 pl-10">
                      {user.objectives.map((obj) => {
                        const oa = calcObjectiveAchievement(obj);
                        return (
                          <div key={obj.id} className="flex items-center gap-2 text-xs">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-gray-500 truncate">{obj.title}</span>
                                <span className="text-gray-400 ml-2 flex-shrink-0">{obj.weight}% bobot · {oa.toFixed(0)}%</span>
                              </div>
                              <ProgressBar value={oa} size="sm" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {user.objectives.length === 0 && (
                    <p className="text-xs text-gray-400 mt-2 pl-10">Belum ada OKR</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ─── MEMBER VIEW ─── */
  const myObjectives = await prisma.objective.findMany({
    where: { userId: session!.user.id, quarterId: activeQuarter.id },
    include: { keyResults: true },
    orderBy: { createdAt: "asc" },
  });

  const myAchievement = calcUserAchievement(myObjectives);
  const allSubmitted = myObjectives.length > 0 && myObjectives.every((o) => o.status === "SUBMITTED");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Saya</h1>
          <p className="text-gray-500 text-sm mt-0.5">{activeQuarter.name}</p>
        </div>
        <div className="bg-yellow-400 rounded-2xl px-6 py-3 text-center">
          <p className="text-xs font-semibold text-gray-700">Pencapaian OKR</p>
          <p className="text-3xl font-bold text-gray-900">{myAchievement.toFixed(2)}%</p>
        </div>
      </div>

      {/* Status pengumpulan */}
      {allSubmitted ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-medium">
          ✓ OKR kamu sudah dikumpulkan. Progress masih bisa diupdate.
        </div>
      ) : myObjectives.length > 0 ? (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-orange-700 text-sm">
          OKR belum dikumpulkan. Pergi ke <a href="/okr" className="underline font-semibold">OKR Saya</a> untuk mengumpulkan.
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
                {/* Objective header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="font-semibold text-gray-800 truncate">{obj.title}</h2>
                    <StatusBadge status={obj.status} />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs text-gray-400">Bobot {obj.weight}%</span>
                    <Badge value={oa} />
                  </div>
                </div>
                <ProgressBar value={oa} />

                {/* Key Results */}
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
