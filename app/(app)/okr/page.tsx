import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OKRManager from "./OKRManager";
import DistribusiAnggota from "./DistribusiAnggota";
import ImportExportSection from "./ImportExportSection";
import QuarterSelector from "./QuarterSelector";
import CollapsibleSection from "./CollapsibleSection";

export default async function OKRPage({ searchParams }: { searchParams: Promise<{ quarterId?: string }> }) {
  const session = await auth();
  const isLead = session!.user.role === "LEAD" || session!.user.role === "ADMIN";

  const { quarterId: selectedId } = await searchParams;

  const quarters = await prisma.quarter.findMany({
    orderBy: [{ year: "desc" }, { quarter: "desc" }],
  });

  const selectedQuarter = selectedId
    ? quarters.find((q) => q.id === selectedId)
    : quarters.find((q) => q.isActive) ?? quarters[0];

  if (quarters.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-slate-900">{isLead ? "OKR Divisi" : "OKR Saya"}</h1>
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
      <div className="space-y-4">
        <QuarterSelector quarters={JSON.parse(JSON.stringify(quarters))} selectedQuarterId={null} isLead={isLead} />
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700 text-sm">
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

  const quarterObjectiveIds = objectives.map((o) => o.id);
  const teamMembers = isLead
    ? await prisma.teamMember.findMany({
        where: { leadId: session!.user.id },
        include: {
          assignments: {
            where: { objectiveId: { in: quarterObjectiveIds } },
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

  const objCount = objectives.length;
  const submittedCount = objectives.filter((o) => o.status === "SUBMITTED").length;

  return (
    <div className="space-y-4">
      {/* Quarter selector */}
      <QuarterSelector
        quarters={JSON.parse(JSON.stringify(quarters))}
        selectedQuarterId={selectedQuarter.id}
        isLead={isLead}
      />

      {/* Bagian 1: OKR */}
      <CollapsibleSection
        title={isLead ? "OKR Divisi" : "OKR Saya"}
        subtitle={selectedQuarter.name}
        badge={
          objCount > 0 ? (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {submittedCount}/{objCount} dikumpulkan
            </span>
          ) : undefined
        }
        defaultOpen={true}
      >
        <OKRManager
          initialObjectives={JSON.parse(JSON.stringify(objectives))}
          quarterId={selectedQuarter.id}
          userId={session!.user.id}
          allQuarters={JSON.parse(JSON.stringify(quarters))}
          isLead={isLead}
        />
      </CollapsibleSection>

      {/* Import / Export */}
      <CollapsibleSection
        title="Import / Export Excel"
        subtitle="Download template → isi → upload, atau ekspor data OKR ke Excel"
        defaultOpen={false}
      >
        <ImportExportSection quarterId={selectedQuarter.id} />
      </CollapsibleSection>

      {/* Bagian 2: Distribusi ke anggota */}
      {isLead && (
        <CollapsibleSection
          title="Distribusi ke Anggota"
          subtitle="Assign anggota ke objective + key result. Bobot objective harus 100%, bobot KR per objective harus 100%."
          badge={
            teamMembers.length > 0 ? (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {teamMembers.length} anggota
              </span>
            ) : undefined
          }
          defaultOpen={true}
        >
          <DistribusiAnggota
            initialMembers={JSON.parse(JSON.stringify(teamMembers))}
            objectives={JSON.parse(JSON.stringify(objectives))}
            leadId={session!.user.id}
            quarterId={selectedQuarter.id}
          />
        </CollapsibleSection>
      )}
    </div>
  );
}
