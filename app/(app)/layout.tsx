import { auth } from "@/auth";
import Sidebar from "@/components/Sidebar";
import SessionProvider from "@/components/SessionProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Middleware already handles redirect to /login if not authenticated
  const session = await auth();
  const role = (session?.user?.role as string) ?? "MEMBER";
  const name = (session?.user?.name as string) ?? "";
  const division = (session?.user?.division as string | null) ?? null;

  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role={role} name={name} division={division} />
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
