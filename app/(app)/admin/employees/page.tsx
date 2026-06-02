import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EmployeeManager from "./EmployeeManager";

export default async function EmployeesPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/dashboard");

  const employees = await prisma.employee.findMany({
    orderBy: [{ division: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">👥 Manajemen Karyawan</h1>
      <p className="text-sm text-slate-500 mb-6">
        Daftar karyawan ini digunakan sebagai referensi saat Lead melakukan distribusi OKR. Pastikan nama, divisi, dan jabatan sudah benar agar tidak terjadi ketidakseragaman.
      </p>
      <EmployeeManager initialEmployees={JSON.parse(JSON.stringify(employees))} />
    </div>
  );
}
