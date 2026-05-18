import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OKRManager from "./OKRManager";

export default async function OKRPage() {
  const session = await auth();
  const activeQuarter = await prisma.quarter.findFirst({ where: { isActive: true } });

  if (!activeQuarter) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">OKR Saya</h1>
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">OKR Saya</h1>
          <p className="text-gray-500 text-sm">{activeQuarter.name}</p>
        </div>
      </div>
      <OKRManager
        initialObjectives={JSON.parse(JSON.stringify(objectives))}
        quarterId={activeQuarter.id}
        userId={session!.user.id}
      />
    </div>
  );
}
