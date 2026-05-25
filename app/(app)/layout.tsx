import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Sidebar from "@/components/Sidebar";
import SessionProvider from "@/components/SessionProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar role={session.user.role} name={session.user.name} division={session.user.division} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </SessionProvider>
  );
}
