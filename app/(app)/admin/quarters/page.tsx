import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuarterManager from "./QuarterManager";

export default async function QuartersPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/dashboard");

  const quarters = await prisma.quarter.findMany({
    orderBy: [{ year: "desc" }, { quarter: "desc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Manajemen Quarter</h1>
      <QuarterManager initialQuarters={JSON.parse(JSON.stringify(quarters))} />
    </div>
  );
}
