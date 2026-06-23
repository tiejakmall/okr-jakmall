"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

type Division = { id: string; name: string };

export default function DivisionManager({ initialDivisions }: { initialDivisions: Division[] }) {
  const [divisions, setDivisions] = useState<Division[]>(initialDivisions);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function addDivision(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/divisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: input }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Gagal menambah divisi");
        return;
      }
      const division = await res.json();
      setDivisions((prev) => [...prev, division].sort((a, b) => a.name.localeCompare(b.name)));
      setInput("");
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDivision(id: string, name: string) {
    if (!confirm(`Hapus divisi "${name}"? Ini tidak menghapus user yang sudah terdaftar.`)) return;
    await fetch(`/api/divisions/${id}`, { method: "DELETE" });
    setDivisions((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="space-y-5">
      {/* Add form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">➕ Tambah Divisi</h2>
        <form onSubmit={addDivision} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="cth: Quality Management Center"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white transition"
          />
          <button
            type="submit"
            disabled={saving || !input.trim()}
            className="bg-amber-400 text-gray-900 font-bold text-sm px-5 py-2.5 rounded-xl
              shadow-[0_4px_0_#d97706] hover:shadow-[0_2px_0_#d97706] hover:translate-y-0.5
              active:shadow-[0_1px_0_#d97706] active:translate-y-[3px]
              disabled:opacity-50 disabled:shadow-none disabled:translate-y-0
              transition-all duration-75"
          >
            {saving ? "⏳" : "Tambah"}
          </button>
        </form>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        <p className="text-xs text-slate-400 mt-2">Huruf kapital otomatis dirapikan.</p>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <span className="font-semibold text-slate-700 text-sm">Daftar Divisi</span>
          <span className="text-slate-400 text-xs ml-2">({divisions.length} divisi)</span>
        </div>
        {divisions.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            Belum ada divisi. Tambahkan di atas.
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {divisions.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition">
                <span className="text-sm font-medium text-slate-800">🏢 {d.name}</span>
                <button
                  onClick={() => deleteDivision(d.id, d.name)}
                  className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50
                    shadow-[0_2px_0_#e2e8f0] hover:shadow-[0_1px_0_#fecaca] hover:translate-y-px
                    active:shadow-none active:translate-y-[2px] transition-all duration-75"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
