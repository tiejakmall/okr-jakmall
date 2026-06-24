import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DivisionManager from "./DivisionManager";

export const metadata: Metadata = { title: "Divisi" };

export default async function DivisionsPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/dashboard");

  const divisions = await prisma.division.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">Manajemen Divisi</h1>
      <DivisionManager initialDivisions={JSON.parse(JSON.stringify(divisions))} />
    </div>
  );
}
