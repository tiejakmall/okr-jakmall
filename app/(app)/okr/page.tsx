import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OKRManager from "./OKRManager";
import DistribusiAnggota from "./DistribusiAnggota";
import ImportExportSection from "./ImportExportSection";
import QuarterSelector from "./QuarterSelector";

export default async function OKRPage({ searchParams }: { searchParams: Promise<{ quarterId?: string }> }) {
  const session = await auth();
  const isLead = session!.user.role === "LEAD" || session!.user.role === "ADMIN";

  const { quarterId: selectedId } = await searchParams;

  const quarters = await prisma.quarter.findMany({
    orderBy: [{ year: "desc" }, { quarter: "desc" }],
  });

  // Determine active quarter: prefer URL param → active → most recent
  const selectedQuarter = selectedId
    ? quarters.find((q) => q.id === selectedId)
    : quarters.find((q) => q.isActive) ?? quarters[0];

  if (quarters.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold text-slate-900 mb-4">
          {isLead ? "OKR Divisi" : "OKR Saya"}
        </h1>
        {isLead ? (
          <QuarterSelector quarters={[]} selectedQuarterId={null} isLead={isLead} />
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700 text-sm">
            Belum ada quarter. Tunggu Lead atau Admin membuat quarter terlebih dahulu.
          </div>
        )}
      </div>
    );
  }

  if (!selectedQuarter) {
    return (
      <div>
        <QuarterSelector quarters={JSON.parse(JSON.stringify(quarters))} selectedQuarterId={null} isLead={isLead} />
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700 text-sm mt-4">
          Pilih quarter di atas untuk melihat OKR.
        </div>
      </div>
    );
  }

  const objectives = await prisma.objective.findMany({
    where: { userId: session!.user.id, quarterId: selectedQuarter.id },
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
              krAssignments: {
                include: {
                  keyResult: {
                    select: { id: true, title: true, target: true, unit: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="space-y-8">
      {/* Quarter selector */}
      <QuarterSelector
        quarters={JSON.parse(JSON.stringify(quarters))}
        selectedQuarterId={selectedQuarter.id}
        isLead={isLead}
      />

      {/* Bagian 1: OKR */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isLead ? "OKR Divisi" : "OKR Saya"}
            </h1>
            <p className="text-slate-500 text-sm">{selectedQuarter.name}</p>
          </div>
        </div>
        <OKRManager
          initialObjectives={JSON.parse(JSON.stringify(objectives))}
          quarterId={selectedQuarter.id}
          userId={session!.user.id}
          allQuarters={JSON.parse(JSON.stringify(quarters))}
        />
      </div>

      {/* Import / Export */}
      <ImportExportSection quarterId={selectedQuarter.id} />

      {/* Bagian 2: Distribusi ke anggota (Lead/Admin only) */}
      {isLead && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Distribusi ke Anggota</h2>
            <p className="text-slate-500 text-sm mt-0.5">
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
