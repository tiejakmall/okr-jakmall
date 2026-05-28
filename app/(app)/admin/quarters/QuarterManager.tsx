"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type Quarter = {
  id: string;
  name: string;
  year: number;
  quarter: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

const btnPrimary =
  "flex items-center gap-2 bg-amber-400 text-gray-900 font-bold text-sm px-4 py-2.5 rounded-xl " +
  "shadow-[0_4px_0_#d97706] hover:shadow-[0_2px_0_#d97706] hover:translate-y-0.5 " +
  "active:shadow-[0_1px_0_#d97706] active:translate-y-[3px] transition-all duration-75";

const btnSecondary =
  "flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl " +
  "shadow-[0_4px_0_#e2e8f0] hover:shadow-[0_2px_0_#e2e8f0] hover:translate-y-0.5 " +
  "active:shadow-[0_1px_0_#e2e8f0] active:translate-y-[3px] transition-all duration-75";

const inputCls =
  "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white transition";

export default function QuarterManager({ initialQuarters }: { initialQuarters: Quarter[] }) {
  const router = useRouter();
  const [quarters, setQuarters] = useState<Quarter[]>(initialQuarters);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", year: new Date().getFullYear(), quarter: 1, startDate: "", endDate: "",
  });

  async function createQuarter() {
    if (!form.name || !form.startDate || !form.endDate) return;
    const res = await fetch("/api/quarters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const q = await res.json();
    setQuarters((prev) => [q, ...prev]);
    setShowForm(false);
    setForm({ name: "", year: new Date().getFullYear(), quarter: 1, startDate: "", endDate: "" });
  }

  async function toggleActive(q: Quarter) {
    const res = await fetch(`/api/quarters/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !q.isActive }),
    });
    const updated = await res.json();
    setQuarters((prev) => prev.map((x) => ({ ...x, isActive: x.id === updated.id ? updated.isActive : false })));
    router.refresh();
  }

  async function deleteQuarter(id: string) {
    if (!confirm("Hapus quarter ini? Semua OKR dalam quarter ini akan terhapus.")) return;
    await fetch(`/api/quarters/${id}`, { method: "DELETE" });
    setQuarters((prev) => prev.filter((q) => q.id !== id));
  }

  return (
    <div>
      <div className="flex justify-end mb-5">
        <button onClick={() => setShowForm(!showForm)} className={btnPrimary}>
          ➕ Tambah Quarter
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-amber-200 p-6 mb-5">
          <h2 className="font-semibold text-slate-800 mb-4">⏱️ Quarter Baru</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Nama Quarter</label>
              <input className={inputCls} placeholder="contoh: Q1 2025" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Tahun</label>
              <input type="number" className={inputCls} value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Quarter (1–4)</label>
              <select className={inputCls} value={form.quarter}
                onChange={(e) => setForm({ ...form, quarter: Number(e.target.value) })}>
                {[1, 2, 3, 4].map((q) => <option key={q} value={q}>Q{q}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">📅 Tanggal Mulai</label>
              <input type="date" className={inputCls} value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">📅 Tanggal Selesai</label>
              <input type="date" className={inputCls} value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={createQuarter} className={btnPrimary}>💾 Simpan</button>
            <button onClick={() => setShowForm(false)} className={btnSecondary}>✕ Batal</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {quarters.map((q) => (
          <div key={q.id} className={`bg-white rounded-2xl border p-5 flex items-center justify-between ${q.isActive ? "border-amber-300" : "border-slate-200"}`}>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h3 className="font-semibold text-slate-800">⏱️ {q.name}</h3>
                {q.isActive && <span className="bg-amber-400 text-gray-900 text-xs font-bold px-2.5 py-0.5 rounded-full">✅ Aktif</span>}
              </div>
              <p className="text-xs text-slate-400">
                📅 {new Date(q.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} –{" "}
                {new Date(q.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleActive(q)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl font-semibold transition-all duration-75 ${
                  q.isActive
                    ? "bg-amber-100 text-amber-700 shadow-[0_3px_0_#fbbf24] hover:shadow-[0_1px_0_#fbbf24] hover:translate-y-0.5 active:shadow-none active:translate-y-[3px]"
                    : "bg-white border border-slate-200 text-slate-600 shadow-[0_3px_0_#e2e8f0] hover:shadow-[0_1px_0_#e2e8f0] hover:translate-y-0.5 active:shadow-none active:translate-y-[3px]"
                }`}
              >
                {q.isActive ? "✅ Aktif" : "▶️ Set Aktif"}
              </button>
              <button
                onClick={() => deleteQuarter(q.id)}
                className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50
                  shadow-[0_3px_0_#e2e8f0] hover:shadow-[0_1px_0_#fecaca] hover:translate-y-0.5
                  active:shadow-none active:translate-y-[3px] transition-all duration-75"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        {quarters.length === 0 && (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">⏱️</div>
            <p className="text-slate-500 text-sm">Belum ada quarter. Tambah quarter pertama.</p>
          </div>
        )}
      </div>
    </div>
  );
}
