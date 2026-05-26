import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OKRManager from "./OKRManager";
import DistribusiAnggota from "./DistribusiAnggota";

export default async function OKRPage() {
  const session = await auth();
  const isLead = session!.user.role === "LEAD" || session!.user.role === "ADMIN";
  const activeQuarter = await prisma.quarter.findFirst({ where: { isActive: true } });

  if (!activeQuarter) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {isLead ? "OKR Divisi" : "OKR Saya"}
        </h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-700">
          Belum ada quarter aktif. Tunggu Admin mengaktifkan quarter.
        </div>
      </div>
    );
  }

  const objectives = await prisma.objective.findMany({
    where: { userId: session!.user.id, quarterId: activeQuarter.id },
    include: { keyResults: true },
    orderBy: { createdAt: "asc" },
  });

  const teamMembers = isLead
    ? await prisma.teamMember.findMany({
        where: { leadId: session!.user.id },
        include: {
          assignments: {
            include: {
              objective: { select: { id: true, title: true } },
              krAssignments: true,
            },
          },
        },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="space-y-8">
      {/* Bagian 1: OKR */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isLead ? "OKR Divisi" : "OKR Saya"}
            </h1>
            <p className="text-gray-500 text-sm">{activeQuarter.name}</p>
          </div>
        </div>
        <OKRManager
          initialObjectives={JSON.parse(JSON.stringify(objectives))}
          quarterId={activeQuarter.id}
          userId={session!.user.id}
        />
      </div>

      {/* Bagian 2: Distribusi ke anggota (Lead/Admin only) */}
      {isLead && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800">Distribusi ke Anggota</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              Assign anggota ke objective + key result. Bobot objective harus 100%, bobot KR per objective harus 100%.
            </p>
          </div>
          <DistribusiAnggota
            initialMembers={JSON.parse(JSON.stringify(teamMembers))}
            objectives={JSON.parse(JSON.stringify(objectives))}
            leadId={session!.user.id}
          />
        </div>
      )}
    </div>
  );
}
