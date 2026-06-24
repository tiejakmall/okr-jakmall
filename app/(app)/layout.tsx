import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import SessionProvider from "@/components/SessionProvider";
import { ConfirmProvider } from "@/components/ConfirmModal";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!session.user.hasOnboarded) redirect("/onboarding");
  if (!session.user.isApproved) redirect("/pending-approval");

  return (
    <SessionProvider>
      <ConfirmProvider>
        <div className="flex min-h-screen bg-slate-50">
          <div className="print:hidden">
            <Sidebar role={session.user.role} name={session.user.name} division={session.user.division} />
          </div>
          <main className="flex-1 overflow-auto min-w-0">
            <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8 pt-16 lg:pt-8">
              {children}
            </div>
          </main>
        </div>
      </ConfirmProvider>
    </SessionProvider>
  );
}
