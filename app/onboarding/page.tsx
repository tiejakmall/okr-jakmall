"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const inputCls =
  "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition";

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [division, setDivision] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && session?.user.hasOnboarded) router.replace("/dashboard");
    if (status === "authenticated" && session?.user.name) {
      setName(session.user.name ?? "");
    }
  }, [status, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Nama tidak boleh kosong."); return; }
    if (role === "LEAD" && !division.trim()) { setError("Nama divisi wajib diisi untuk Lead Divisi."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, division, role }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Gagal menyimpan. Coba lagi.");
        setSaving(false);
        return;
      }
      const data = await res.json();
      await update();
      if (data.role === "LEAD") {
        router.replace("/pending-approval");
      } else {
        router.replace("/dashboard");
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setSaving(false);
    }
  }

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-amber-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-white border-r border-slate-200 flex-col items-center justify-center px-16">
        <div className="text-center max-w-xs">
          <div className="text-6xl mb-5">👋</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Selamat Datang!</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Lengkapi profil kamu sebelum mulai. Ini cuma sekali saja.
          </p>
          <div className="mt-8 space-y-3 text-left">
            {[
              { emoji: "👤", label: "Member", desc: "Anggota divisi, bisa lihat & isi progress OKR sendiri" },
              { emoji: "⭐", label: "Lead Divisi", desc: "Kelola OKR tim, distribusi ke anggota — perlu disetujui admin" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-lg mt-0.5">{item.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-slate-700">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">📈</span>
              <span className="text-xl font-bold text-slate-900">OKR Tracker</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Lengkapi Profil</h1>
            <p className="text-slate-500 text-sm mt-1">Siapa kamu di organisasi ini?</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">👤 Nama Lengkap</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="Nama lengkap kamu"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">🎭 Role</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "MEMBER", emoji: "👤", label: "Member" },
                  { value: "LEAD", emoji: "⭐", label: "Lead Divisi" },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                      role === r.value
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-2xl">{r.emoji}</span>
                    {r.label}
                  </button>
                ))}
              </div>
              {role === "LEAD" && (
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⏳ Sebagai Lead Divisi, akun kamu perlu disetujui admin terlebih dahulu.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                🏢 Divisi
                {role === "LEAD" && <span className="text-red-400 ml-1">*</span>}
                {role === "MEMBER" && <span className="text-slate-400 font-normal ml-1">(opsional)</span>}
              </label>
              <input
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className={inputCls}
                placeholder="cth: Finance, Marketing, HRD..."
                required={role === "LEAD"}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <span>⚠️</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-amber-400 text-gray-900 font-bold py-2.5 rounded-xl text-sm
                shadow-[0_4px_0_#d97706]
                hover:shadow-[0_2px_0_#d97706] hover:translate-y-0.5
                active:shadow-[0_1px_0_#d97706] active:translate-y-[3px]
                disabled:opacity-60 disabled:shadow-none disabled:translate-y-0
                transition-all duration-75 flex items-center justify-center gap-2"
            >
              {saving ? (
                <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
              ) : (
                <>🚀 Mulai Gunakan OKR Tracker</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
