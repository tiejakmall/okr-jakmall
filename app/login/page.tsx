"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email atau password salah.");
    } else {
      window.location.href = "/dashboard";
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-white border-r border-slate-200 flex-col items-center justify-center px-16">
        <div className="text-center max-w-xs">
          <div className="text-6xl mb-5">📈</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">OKR Tracker</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Pantau pencapaian OKR tim kamu secara real-time dan transparan.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { emoji: "🎯", label: "Objectives", desc: "Terstruktur" },
              { emoji: "🔑", label: "Key Results", desc: "Terukur" },
              { emoji: "📊", label: "Progress", desc: "Real-time" },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-xl mb-1">{item.emoji}</div>
                <p className="text-xs font-bold text-slate-700">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-2xl">📈</span>
            <span className="text-xl font-bold text-slate-900">OKR Tracker</span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900">Selamat datang 👋</h1>
            <p className="text-slate-500 text-sm mt-1">Masuk ke akun kamu untuk melanjutkan</p>
          </div>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm
              shadow-[0_4px_0_#e2e8f0] hover:shadow-[0_2px_0_#e2e8f0] hover:translate-y-0.5
              active:shadow-[0_1px_0_#e2e8f0] active:translate-y-[3px] transition-all duration-75 mb-4"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Lanjutkan dengan Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">atau</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                📧 Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="nama@perusahaan.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                🔒 Password
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
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
              disabled={loading}
              className="w-full bg-amber-400 text-gray-900 font-bold py-2.5 rounded-xl text-sm
                shadow-[0_4px_0_#d97706]
                hover:shadow-[0_2px_0_#d97706] hover:translate-y-0.5
                active:shadow-[0_1px_0_#d97706] active:translate-y-[3px]
                disabled:opacity-60 disabled:shadow-none disabled:translate-y-0
                transition-all duration-75 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Masuk...
                </>
              ) : (
                <>🚀 Masuk</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
