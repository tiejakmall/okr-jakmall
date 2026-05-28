"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { calcObjectiveAchievement, calcKRAchievement } from "@/lib/calculations";

type KeyResult = {
  id: string;
  title: string;
  target: number;
  unit: string;
  weight: number;
  teamProgress: number;
  leadProgress: number | null;
};

type Objective = {
  id: string;
  title: string;
  weight: number;
  status: "DRAFT" | "SUBMITTED";
  submittedAt: string | null;
  keyResults: KeyResult[];
};

type Props = {
  initialObjectives: Objective[];
  quarterId: string;
  userId: string;
};

const UNITS = ["%", "pcs", "x", "score", "hari", "bulan", "orang", "lainnya"];

// ─── Button helpers ───────────────────────────────────────────────────────────

const btnPrimary =
  "flex items-center gap-2 bg-amber-400 text-gray-900 font-bold text-sm px-4 py-2 rounded-xl " +
  "shadow-[0_4px_0_#d97706] hover:shadow-[0_2px_0_#d97706] hover:translate-y-0.5 " +
  "active:shadow-[0_1px_0_#d97706] active:translate-y-[3px] " +
  "disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 transition-all duration-75";

const btnSecondary =
  "flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold text-sm px-4 py-2 rounded-xl " +
  "shadow-[0_4px_0_#e2e8f0] hover:shadow-[0_2px_0_#e2e8f0] hover:translate-y-0.5 " +
  "active:shadow-[0_1px_0_#e2e8f0] active:translate-y-[3px] transition-all duration-75";

const btnDanger =
  "text-slate-300 hover:text-red-500 transition-colors duration-100";

// ─── Weight bar ───────────────────────────────────────────────────────────────

function WeightBar({ objectives }: { objectives: Objective[] }) {
  const total = objectives.reduce((s, o) => s + Number(o.weight), 0);
  const isOk = Math.abs(total - 100) <= 0.01;
  const colors = [
    "bg-amber-400", "bg-blue-400", "bg-emerald-400",
    "bg-violet-400", "bg-rose-400", "bg-cyan-400",
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-700 text-sm">⚖️ Distribusi Bobot Objective</h2>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
          total === 0 ? "bg-slate-100 text-slate-500"
          : isOk ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-600"
        }`}>
          {total}%{isOk ? " ✅" : total > 0 ? " · harus 100%" : ""}
        </span>
      </div>

      {objectives.length > 0 && (
        <>
          <div className="h-3 rounded-full overflow-hidden flex gap-px mb-3 bg-slate-100">
            {objectives.map((obj, i) => (
              <div
                key={obj.id}
                className={`${colors[i % colors.length]} h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${Math.max(Number(obj.weight), 0)}%` }}
                title={`${obj.title}: ${obj.weight}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {objectives.map((obj, i) => (
              <div key={obj.id} className="flex items-center gap-1.5 text-xs">
                <div className={`w-2.5 h-2.5 rounded-sm ${colors[i % colors.length]}`} />
                <span className="text-slate-600 truncate max-w-[8rem]">{obj.title}</span>
                <span className="font-bold text-slate-700">{obj.weight}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OKRManager({ initialObjectives, quarterId, userId }: Props) {
  const router = useRouter();
  const [objectives, setObjectives] = useState<Objective[]>(initialObjectives);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const allSubmitted = objectives.length > 0 && objectives.every((o) => o.status === "SUBMITTED");
  const someSubmitted = objectives.some((o) => o.status === "SUBMITTED");
  const totalWeight = objectives.reduce((s, o) => s + Number(o.weight), 0);
  const weightOk = Math.abs(totalWeight - 100) <= 0.01;

  async function addObjective() {
    const res = await fetch("/api/objectives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Objective baru", weight: 0, quarterId, userId }),
    });
    const obj = await res.json();
    setObjectives((prev) => [...prev, { ...obj, keyResults: [] }]);
    setExpanded((prev) => ({ ...prev, [obj.id]: true }));
  }

  async function updateObjective(id: string, data: Partial<Objective>) {
    setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)));
  }

  async function saveObjective(obj: Objective) {
    setSaving(true);
    await fetch(`/api/objectives/${obj.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: obj.title, weight: Number(obj.weight) }),
    });
    setSaving(false);
  }

  async function deleteObjective(id: string) {
    if (!confirm("Hapus objective ini beserta semua key result-nya?")) return;
    const res = await fetch(`/api/objectives/${id}`, { method: "DELETE" });
    if (!res.ok) { alert((await res.json()).error); return; }
    setObjectives((prev) => prev.filter((o) => o.id !== id));
  }

  async function submitAllOKR() {
    if (!weightOk) { alert("Total bobot objective harus 100% sebelum dikumpulkan."); return; }
    if (!confirm("Kumpulkan semua OKR? Setelah dikumpulkan, kamu tidak bisa mengubah objective dan key result.")) return;
    setSaving(true);
    for (const obj of objectives.filter((o) => o.status === "DRAFT")) {
      await fetch(`/api/objectives/${obj.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SUBMITTED" }),
      });
    }
    setSaving(false);
    setObjectives((prev) => prev.map((o) => ({ ...o, status: "SUBMITTED" as const, submittedAt: new Date().toISOString() })));
    router.refresh();
  }

  async function recallOKR(id: string) {
    if (!confirm("Tarik kembali OKR ini ke draft?")) return;
    await fetch(`/api/objectives/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DRAFT" }),
    });
    setObjectives((prev) => prev.map((o) => o.id === id ? { ...o, status: "DRAFT", submittedAt: null } : o));
  }

  async function addKeyResult(objectiveId: string) {
    const res = await fetch("/api/key-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Key Result baru", target: 100, unit: "%", weight: 0, objectiveId }),
    });
    const kr = await res.json();
    setObjectives((prev) => prev.map((o) => o.id === objectiveId ? { ...o, keyResults: [...o.keyResults, kr] } : o));
  }

  async function updateKR(objectiveId: string, krId: string, data: Partial<KeyResult>) {
    setObjectives((prev) =>
      prev.map((o) =>
        o.id === objectiveId
          ? { ...o, keyResults: o.keyResults.map((kr) => (kr.id === krId ? { ...kr, ...data } : kr)) }
          : o
      )
    );
  }

  async function saveKR(kr: KeyResult) {
    setSaving(true);
    await fetch(`/api/key-results/${kr.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: kr.title, target: Number(kr.target), unit: kr.unit, weight: Number(kr.weight) }),
    });
    setSaving(false);
  }

  async function deleteKR(objectiveId: string, krId: string) {
    if (!confirm("Hapus key result ini?")) return;
    await fetch(`/api/key-results/${krId}`, { method: "DELETE" });
    setObjectives((prev) => prev.map((o) => o.id === objectiveId ? { ...o, keyResults: o.keyResults.filter((kr) => kr.id !== krId) } : o));
  }

  return (
    <div className="space-y-4">
      <WeightBar objectives={objectives} />

      {/* Status banners */}
      {allSubmitted ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-lg">✅</span>
          <div>
            <p className="font-semibold text-green-700 text-sm">OKR sudah dikumpulkan!</p>
            <p className="text-green-600 text-xs mt-0.5">Progress diisi oleh anggota di bagian Distribusi Anggota di bawah.</p>
          </div>
        </div>
      ) : someSubmitted ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <p className="text-blue-700 text-sm">Sebagian OKR sudah dikumpulkan. Selesaikan semua objective lalu kumpulkan.</p>
        </div>
      ) : null}

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{saving ? "⏳ Menyimpan..." : "💾 Tersimpan otomatis"}</p>
        <div className="flex gap-2">
          {!allSubmitted && (
            <button onClick={addObjective} className={btnSecondary}>
              ➕ Tambah Objective
            </button>
          )}
          {objectives.length > 0 && !allSubmitted && (
            <button onClick={submitAllOKR} disabled={saving || !weightOk} className={btnPrimary}>
              📤 Kumpulkan OKR
            </button>
          )}
        </div>
      </div>

      {/* Empty */}
      {objectives.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-slate-500 text-sm">Belum ada objective. Klik "Tambah Objective" untuk mulai.</p>
        </div>
      )}

      {/* Objective cards */}
      {objectives.map((obj) => {
        const isLocked = obj.status === "SUBMITTED";
        const krTotalWeight = obj.keyResults.reduce((s, kr) => s + Number(kr.weight), 0);
        const krWeightOk = Math.abs(krTotalWeight - 100) <= 0.01;
        const isExpanded = expanded[obj.id] ?? false;
        const achievement = calcObjectiveAchievement(obj);

        return (
          <div
            key={obj.id}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
              isLocked ? "border-green-200" : "border-slate-200"
            }`}
          >
            {/* Objective header */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <button
                onClick={() => setExpanded((p) => ({ ...p, [obj.id]: !p[obj.id] }))}
                className="text-slate-400 hover:text-slate-600 transition flex-shrink-0"
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <input
                className="flex-1 font-semibold text-slate-800 text-sm border-b border-transparent hover:border-slate-200 focus:border-amber-400 focus:outline-none bg-transparent py-0.5 disabled:cursor-default disabled:text-slate-600"
                value={obj.title}
                disabled={isLocked}
                onChange={(e) => updateObjective(obj.id, { title: e.target.value })}
                onBlur={() => !isLocked && saveObjective(obj)}
              />

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs text-slate-400">Bobot</span>
                <input
                  type="number"
                  className="w-14 text-right border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-amber-400 disabled:bg-slate-50 disabled:cursor-default"
                  value={obj.weight}
                  disabled={isLocked}
                  onChange={(e) => updateObjective(obj.id, { weight: Number(e.target.value) })}
                  onBlur={() => !isLocked && saveObjective(obj)}
                  min={0} max={100}
                />
                <span className="text-xs text-slate-400">%</span>
              </div>

              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${
                achievement >= 100 ? "bg-green-100 text-green-700"
                : achievement >= 70 ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-600"
              }`}>
                {achievement >= 100 ? "🏆" : achievement >= 70 ? "🔥" : "📉"} {achievement.toFixed(0)}%
              </span>

              {isLocked ? (
                <button
                  onClick={() => recallOKR(obj.id)}
                  className="text-slate-400 hover:text-orange-500 transition flex-shrink-0 text-base"
                  title="Tarik kembali ke draft"
                >
                  🔄
                </button>
              ) : (
                <button onClick={() => deleteObjective(obj.id)} className={`${btnDanger} flex-shrink-0`}>
                  <Trash2 size={15} />
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div className="px-4 pb-2">
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-1 rounded-full transition-all ${
                    achievement >= 100 ? "bg-green-500" : achievement >= 70 ? "bg-amber-400" : "bg-red-400"
                  }`}
                  style={{ width: `${Math.min(achievement, 100)}%` }}
                />
              </div>
            </div>

            {/* Key Results */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">🔑 Bobot KR: {krTotalWeight}%</span>
                    {obj.keyResults.length > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        krWeightOk ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}>
                        {krWeightOk ? "✅" : "harus 100%"}
                      </span>
                    )}
                  </div>
                  {!isLocked && (
                    <button
                      onClick={() => addKeyResult(obj.id)}
                      className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-bold bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg
                        shadow-[0_3px_0_#d97706] hover:shadow-[0_1px_0_#d97706] hover:translate-y-0.5
                        active:shadow-none active:translate-y-[3px] transition-all duration-75"
                    >
                      ➕ Tambah KR
                    </button>
                  )}
                </div>

                {obj.keyResults.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                    🔑 Belum ada key result.
                  </p>
                )}

                <div className="space-y-2">
                  {obj.keyResults.map((kr) => {
                    const pct = calcKRAchievement(kr);
                    return (
                      <div key={kr.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            className="flex-1 text-sm font-medium text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-amber-400 focus:outline-none disabled:cursor-default"
                            value={kr.title}
                            disabled={isLocked}
                            onChange={(e) => updateKR(obj.id, kr.id, { title: e.target.value })}
                            onBlur={() => !isLocked && saveKR(kr)}
                            placeholder="Judul Key Result"
                          />
                          {!isLocked && (
                            <button onClick={() => deleteKR(obj.id, kr.id)} className={`${btnDanger} flex-shrink-0`}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                          <div>
                            <label className="block text-slate-400 mb-1 font-medium">🎯 Target</label>
                            <input
                              type="number"
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-amber-400 bg-white disabled:bg-slate-50 disabled:cursor-default"
                              value={kr.target}
                              disabled={isLocked}
                              onChange={(e) => updateKR(obj.id, kr.id, { target: Number(e.target.value) })}
                              onBlur={() => !isLocked && saveKR(kr)}
                              min={0}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 mb-1 font-medium">📏 Satuan</label>
                            <select
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-amber-400 bg-white disabled:cursor-default"
                              value={kr.unit}
                              disabled={isLocked}
                              onChange={(e) => updateKR(obj.id, kr.id, { unit: e.target.value })}
                              onBlur={() => !isLocked && saveKR(kr)}
                            >
                              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-400 mb-1 font-medium">⚖️ Bobot (%)</label>
                            <input
                              type="number"
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-amber-400 bg-white disabled:bg-slate-50 disabled:cursor-default"
                              value={kr.weight}
                              disabled={isLocked}
                              onChange={(e) => updateKR(obj.id, kr.id, { weight: Number(e.target.value) })}
                              onBlur={() => !isLocked && saveKR(kr)}
                              min={0} max={100}
                            />
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 italic mb-2">
                          💡 Progress diisi oleh anggota di bagian Distribusi Anggota ↓
                        </p>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                pct >= 100 ? "bg-green-500" : pct >= 70 ? "bg-amber-400" : "bg-red-400"
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-500 w-10 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
