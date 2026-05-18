"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, CheckCircle, Circle } from "lucide-react";

type Quarter = {
  id: string;
  name: string;
  year: number;
  quarter: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export default function QuarterManager({ initialQuarters }: { initialQuarters: Quarter[] }) {
  const router = useRouter();
  const [quarters, setQuarters] = useState<Quarter[]>(initialQuarters);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    year: new Date().getFullYear(),
    quarter: 1,
    startDate: "",
    endDate: "",
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
    setQuarters((prev) =>
      prev.map((x) => ({ ...x, isActive: x.id === updated.id ? updated.isActive : false }))
    );
    router.refresh();
  }

  async function deleteQuarter(id: string) {
    if (!confirm("Hapus quarter ini? Semua OKR dalam quarter ini akan terhapus.")) return;
    await fetch(`/api/quarters/${id}`, { method: "DELETE" });
    setQuarters((prev) => prev.filter((q) => q.id !== id));
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} /> Tambah Quarter
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-2 border-yellow-200">
          <h2 className="font-semibold text-gray-800 mb-4">Quarter Baru</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Nama Quarter</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                placeholder="contoh: Q1 2025"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tahun</label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quarter (1-4)</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 bg-white"
                value={form.quarter}
                onChange={(e) => setForm({ ...form, quarter: Number(e.target.value) })}
              >
                {[1, 2, 3, 4].map((q) => (
                  <option key={q} value={q}>
                    Q{q}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tanggal Selesai</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={createQuarter}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg transition"
            >
              Simpan
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {quarters.map((q) => (
          <div
            key={q.id}
            className={`bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between ${q.isActive ? "border-2 border-yellow-400" : ""}`}
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-800">{q.name}</h3>
                {q.isActive && (
                  <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(q.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} –{" "}
                {new Date(q.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleActive(q)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition ${
                  q.isActive
                    ? "bg-yellow-100 text-yellow-700"
                    : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {q.isActive ? <CheckCircle size={14} /> : <Circle size={14} />}
                {q.isActive ? "Aktif" : "Set Aktif"}
              </button>
              <button
                onClick={() => deleteQuarter(q.id)}
                className="text-red-400 hover:text-red-600 transition p-1.5"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {quarters.length === 0 && (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-400">
            Belum ada quarter. Tambah quarter pertama.
          </div>
        )}
      </div>
    </div>
  );
}
