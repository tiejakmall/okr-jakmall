"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function PendingApprovalPage() {
  const { update } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) return;
        const data = await res.json();
        if (data.isApproved) {
          clearInterval(interval);
          setChecking(true);
          await update();
          router.replace("/dashboard");
        }
      } catch {
        // network error, retry next tick
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [router, update]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-amber-400 mx-auto mb-3" size={32} />
          <p className="text-slate-600 text-sm">Mengarahkan ke dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Menunggu Persetujuan</h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Permintaan kamu sebagai <span className="font-semibold text-amber-600">Lead Divisi</span> sedang
            menunggu persetujuan dari admin. Halaman ini akan otomatis refresh ketika sudah disetujui.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-6">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Mengecek status setiap 5 detik...
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full bg-white border border-slate-200 text-slate-600 font-semibold py-2 rounded-xl text-sm
              shadow-[0_3px_0_#e2e8f0] hover:shadow-[0_1px_0_#e2e8f0] hover:translate-y-0.5
              transition-all duration-75"
          >
            Keluar
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Hubungi admin jika terlalu lama menunggu.
        </p>
      </div>
    </div>
  );
}
