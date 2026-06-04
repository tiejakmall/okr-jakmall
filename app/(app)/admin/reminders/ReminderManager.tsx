"use client";

import { useState } from "react";

type Quarter = { id: string; name: string; isActive: boolean };
type Lead = {
  id: string;
  name: string;
  email: string;
  division: string | null;
  hasOKR: boolean;
  hasProgress: boolean;
};
type SendResult = { name: string; email: string; status: "sent" | "error"; error?: string };

const btnAmber =
  "flex items-center gap-2 bg-amber-400 text-gray-900 font-bold text-sm px-5 py-2.5 rounded-xl " +
  "shadow-[0_4px_0_#d97706] hover:shadow-[0_2px_0_#d97706] hover:translate-y-0.5 " +
  "active:shadow-[0_1px_0_#d97706] active:translate-y-[3px] " +
  "disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 transition-all duration-75";

const btnSlate =
  "flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-xl " +
  "shadow-[0_4px_0_#e2e8f0] hover:shadow-[0_2px_0_#e2e8f0] hover:translate-y-0.5 " +
  "active:shadow-[0_1px_0_#e2e8f0] active:translate-y-[3px] transition-all duration-75";

export default function ReminderManager({
  quarters,
  initialLeads,
}: {
  quarters: Quarter[];
  initialLeads: Lead[];
}) {
  const activeQuarter = quarters.find((q) => q.isActive) ?? quarters[0];
  const [selectedQuarterId, setSelectedQuarterId] = useState(activeQuarter?.id ?? "");
  const [sending, setSending] = useState<"settings" | "results" | null>(null);
  const [result, setResult] = useState<{ type: "settings" | "results"; message: string; results: SendResult[]; success: boolean } | null>(null);

  const selectedQuarter = quarters.find((q) => q.id === selectedQuarterId);

  async function sendReminder(type: "settings" | "results") {
    if (!selectedQuarterId) return;
    setSending(type);
    setResult(null);
    try {
      const res = await fetch("/api/admin/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, quarterId: selectedQuarterId }),
      });
      const data = await res.json();
      setResult({ type, message: data.message ?? (res.ok ? "Terkirim." : "Gagal."), results: data.results ?? [], success: data.success ?? res.ok });
    } catch {
      setResult({ type, message: "Terjadi kesalahan jaringan.", results: [], success: false });
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Quarter selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <label className="block text-sm font-semibold text-slate-700 mb-2">⏱️ Pilih Quarter</label>
        <select
          className="w-full max-w-xs border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          value={selectedQuarterId}
          onChange={(e) => { setSelectedQuarterId(e.target.value); setResult(null); }}
        >
          <option value="">-- Pilih Quarter --</option>
          {quarters.map((q) => (
            <option key={q.id} value={q.id}>{q.name}{q.isActive ? " ✅" : ""}</option>
          ))}
        </select>
      </div>

      {/* Reminder cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Card 1: Setting OKR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🎯</span>
              <h3 className="font-bold text-slate-800">Reminder Setting OKR</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kirim email ke semua Lead Divisi untuk segera membuat Objective &amp; Key Results di halaman OKR Divisi.
              Cocok dikirim di <strong>awal quarter</strong>.
            </p>
          </div>
          <button
            onClick={() => sendReminder("settings")}
            disabled={!selectedQuarterId || sending !== null}
            className={btnAmber}
          >
            {sending === "settings" ? "⏳ Mengirim..." : "📧 Kirim Reminder Setting"}
          </button>
        </div>

        {/* Card 2: Isi Progress/Hasil */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📊</span>
              <h3 className="font-bold text-slate-800">Reminder Isi Hasil</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kirim email ke semua Lead Divisi untuk segera mengupdate progress OKR anggota mereka di halaman Distribusi.
              Cocok dikirim <strong>menjelang akhir quarter</strong>.
            </p>
          </div>
          <button
            onClick={() => sendReminder("results")}
            disabled={!selectedQuarterId || sending !== null}
            className={btnSlate}
          >
            {sending === "results" ? "⏳ Mengirim..." : "📧 Kirim Reminder Hasil"}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-2xl border p-5 space-y-3 ${result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <p className={`font-semibold text-sm ${result.success ? "text-green-700" : "text-red-700"}`}>
            {result.success ? "✅" : "❌"}{" "}
            {result.type === "settings" ? "Reminder Setting OKR" : "Reminder Isi Hasil"} —{" "}
            {result.message}
          </p>
          {result.results.length > 0 && (
            <div className="space-y-1">
              {result.results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={r.status === "sent" ? "text-green-600" : "text-red-500"}>
                    {r.status === "sent" ? "✓" : "✗"}
                  </span>
                  <span className="font-medium text-slate-700">{r.name}</span>
                  <span className="text-slate-400">{r.email}</span>
                  {r.error && <span className="text-red-500">— {r.error}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lead list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <p className="font-semibold text-slate-700 text-sm">📋 Daftar Lead Divisi ({initialLeads.length} orang)</p>
          <p className="text-xs text-slate-400 mt-0.5">Reminder akan dikirim ke semua lead di bawah ini.</p>
        </div>
        {initialLeads.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Belum ada Lead Divisi terdaftar.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400">
                <th className="text-left px-5 py-2.5 font-semibold">Nama</th>
                <th className="text-left px-5 py-2.5 font-semibold">Email</th>
                <th className="text-left px-5 py-2.5 font-semibold">Divisi</th>
                {selectedQuarter && (
                  <>
                    <th className="text-center px-3 py-2.5 font-semibold">OKR {selectedQuarter.name}</th>
                    <th className="text-center px-3 py-2.5 font-semibold">Progress</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {initialLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3 font-medium text-slate-800">{lead.name}</td>
                  <td className="px-5 py-3 text-slate-500">{lead.email}</td>
                  <td className="px-5 py-3 text-slate-500">{lead.division ?? "—"}</td>
                  {selectedQuarter && (
                    <>
                      <td className="px-3 py-3 text-center">
                        {lead.hasOKR
                          ? <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">✅ Sudah</span>
                          : <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg">⚠️ Belum</span>
                        }
                      </td>
                      <td className="px-3 py-3 text-center">
                        {lead.hasProgress
                          ? <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">✅ Ada</span>
                          : <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">— Kosong</span>
                        }
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
