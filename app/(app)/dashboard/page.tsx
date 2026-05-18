import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcUserAchievement, calcObjectiveAchievement } from "@/lib/calculations";

function AchievementBadge({ value }: { value: number }) {
  const color =
    value >= 100 ? "bg-green-500" : value >= 70 ? "bg-yellow-400" : "bg-red-400";
  return (
    <span className={`${color} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
      {value.toFixed(1)}%
    </span>
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
          Belum ada quarter aktif. Minta Admin untuk mengaktifkan quarter terlebih dahulu.
        </div>
      </div>
    );
  }

  const isAdmin = session!.user.role === "ADMIN";

  if (isAdmin) {
    const allUsers = await prisma.user.findMany({
      include: {
        objectives: {
          where: { quarterId: activeQuarter.id },
          include: { keyResults: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const divisionAchievement =
      allUsers.length > 0
        ? allUsers.reduce((s, u) => s + calcUserAchievement(u.objectives), 0) /
          allUsers.length
        : 0;

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Divisi</h1>
            <p className="text-gray-500 text-sm">{activeQuarter.name}</p>
          </div>
          <div className="bg-yellow-400 rounded-2xl px-6 py-3 text-center">
            <p className="text-xs font-semibold text-gray-700">Pencapaian OKR Divisi</p>
            <p className="text-3xl font-bold text-gray-900">{divisionAchievement.toFixed(2)}%</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nama</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Divisi</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Objectives</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Pencapaian</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => {
                const achievement = calcUserAchievement(user.objectives);
                return (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                    <td className="px-4 py-3 text-gray-500">{user.division ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-500">{user.objectives.length}</td>
                    <td className="px-4 py-3 text-right">
                      <AchievementBadge value={achievement} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const myObjectives = await prisma.objective.findMany({
    where: { userId: session!.user.id, quarterId: activeQuarter.id },
    include: { keyResults: true },
    orderBy: { createdAt: "asc" },
  });

  const myAchievement = calcUserAchievement(myObjectives);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Saya</h1>
          <p className="text-gray-500 text-sm">{activeQuarter.name}</p>
        </div>
        <div className="bg-yellow-400 rounded-2xl px-6 py-3 text-center">
          <p className="text-xs font-semibold text-gray-700">Pencapaian OKR</p>
          <p className="text-3xl font-bold text-gray-900">{myAchievement.toFixed(2)}%</p>
        </div>
      </div>

      {myObjectives.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-blue-700">
          Belum ada OKR untuk quarter ini.{" "}
          <a href="/okr" className="underline font-semibold">
            Tambah OKR sekarang
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {myObjectives.map((obj) => {
            const objAchievement = calcObjectiveAchievement(obj);
            return (
              <div key={obj.id} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-800">{obj.title}</h2>
                    <p className="text-xs text-gray-400">Bobot: {obj.weight}%</p>
                  </div>
                  <AchievementBadge value={objAchievement} />
                </div>
                <div className="space-y-2">
                  {obj.keyResults.map((kr) => {
                    const progress = kr.leadProgress ?? kr.teamProgress;
                    const pct = kr.target > 0 ? Math.min((progress / kr.target) * 100, 100) : 0;
                    return (
                      <div key={kr.id} className="text-sm">
                        <div className="flex justify-between text-gray-600 mb-1">
                          <span>{kr.title}</span>
                          <span className="font-medium">
                            {progress}/{kr.target} {kr.unit} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full">
                          <div
                            className="h-2 rounded-full bg-yellow-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
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
