"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronDown, ChevronUp, Send, RotateCcw, Lock } from "lucide-react";
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

function WeightBar({ objectives }: { objectives: Objective[] }) {
  const total = objectives.reduce((s, o) => s + Number(o.weight), 0);
  const colors = ["bg-yellow-400", "bg-blue-400", "bg-green-400", "bg-purple-400", "bg-red-400", "bg-orange-400"];
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-700 text-sm">Distribusi Bobot Objective</h2>
        <span className={`text-sm font-bold ${Math.abs(total - 100) > 0.01 && total > 0 ? "text-red-500" : "text-green-600"}`}>
          Total: {total}% {Math.abs(total - 100) > 0.01 && total > 0 ? "⚠ harus 100%" : total === 100 ? "✓" : ""}
        </span>
      </div>
      {objectives.length > 0 && (
        <>
          <div className="h-4 rounded-full overflow-hidden flex mb-3">
            {objectives.map((obj, i) => (
              <div
                key={obj.id}
                className={`${colors[i % colors.length]} h-full transition-all`}
                style={{ width: `${Math.max(Number(obj.weight), 0)}%` }}
                title={`${obj.title}: ${obj.weight}%`}
              />
            ))}
            {total < 100 && (
              <div className="bg-gray-100 h-full flex-1" />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {objectives.map((obj, i) => (
              <div key={obj.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className={`w-3 h-3 rounded-sm ${colors[i % colors.length]}`} />
                <span className="truncate max-w-32">{obj.title}</span>
                <span className="font-semibold">{obj.weight}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OKRManager({ initialObjectives, quarterId, userId }: Props) {
  const router = useRouter();
  const [objectives, setObjectives] = useState<Objective[]>(initialObjectives);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const allSubmitted = objectives.length > 0 && objectives.every((o) => o.status === "SUBMITTED");
  const someSubmitted = objectives.some((o) => o.status === "SUBMITTED");
  const totalWeight = objectives.reduce((s, o) => s + Number(o.weight), 0);

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
    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
      return;
    }
    setObjectives((prev) => prev.filter((o) => o.id !== id));
  }

  async function submitAllOKR() {
    if (Math.abs(totalWeight - 100) > 0.01) {
      alert("Total bobot objective harus 100% sebelum dikumpulkan.");
      return;
    }
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
    if (!confirm("Tarik kembali OKR ini ke draft? Kamu bisa mengubahnya lagi.")) return;
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
    setObjectives((prev) =>
      prev.map((o) => o.id === objectiveId ? { ...o, keyResults: [...o.keyResults, kr] } : o)
    );
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
      body: JSON.stringify({
        title: kr.title,
        target: Number(kr.target),
        unit: kr.unit,
        weight: Number(kr.weight),
        teamProgress: Number(kr.teamProgress),
        leadProgress: kr.leadProgress !== null ? Number(kr.leadProgress) : null,
      }),
    });
    setSaving(false);
  }

  async function deleteKR(objectiveId: string, krId: string) {
    if (!confirm("Hapus key result ini?")) return;
    await fetch(`/api/key-results/${krId}`, { method: "DELETE" });
    setObjectives((prev) =>
      prev.map((o) =>
        o.id === objectiveId ? { ...o, keyResults: o.keyResults.filter((kr) => kr.id !== krId) } : o
      )
    );
  }

  return (
    <div className="space-y-4">

      {/* Bobot per individu */}
      <WeightBar objectives={objectives} />

      {/* Status banner */}
      {allSubmitted ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <Lock size={18} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-700 text-sm">OKR sudah dikumpulkan ✓</p>
            <p className="text-green-600 text-xs">Kamu masih bisa update progress di setiap Key Result.</p>
          </div>
        </div>
      ) : someSubmitted ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-700 text-sm">
          Sebagian OKR sudah dikumpulkan. Selesaikan semua objective lalu kumpulkan.
        </div>
      ) : null}

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {saving ? "Menyimpan..." : "Perubahan tersimpan otomatis"}
        </p>
        <div className="flex gap-2">
          {!allSubmitted && (
            <button
              onClick={addObjective}
              className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm px-4 py-2 rounded-lg transition"
            >
              <Plus size={15} /> Tambah Objective
            </button>
          )}
          {objectives.length > 0 && !allSubmitted && (
            <button
              onClick={submitAllOKR}
              disabled={saving || Math.abs(totalWeight - 100) > 0.01}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg transition"
            >
              <Send size={15} /> Kumpulkan OKR
            </button>
          )}
        </div>
      </div>

      {objectives.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-400">
          Belum ada objective. Klik "Tambah Objective" untuk mulai mengisi OKR.
        </div>
      )}

      {objectives.map((obj) => {
        const isLocked = obj.status === "SUBMITTED";
        const krTotalWeight = obj.keyResults.reduce((s, kr) => s + Number(kr.weight), 0);
        const isExpanded = expanded[obj.id] ?? false;
        const achievement = calcObjectiveAchievement(obj);

        return (
          <div key={obj.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden ${isLocked ? "border border-green-200" : ""}`}>
            {/* Objective header */}
            <div className="flex items-center gap-3 p-4 border-b">
              <button
                onClick={() => setExpanded((p) => ({ ...p, [obj.id]: !p[obj.id] }))}
                className="text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              <input
                className="flex-1 font-semibold text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-yellow-400 focus:outline-none bg-transparent py-0.5 text-sm disabled:cursor-default"
                value={obj.title}
                disabled={isLocked}
                onChange={(e) => updateObjective(obj.id, { title: e.target.value })}
                onBlur={() => !isLocked && saveObjective(obj)}
              />

              {/* Bobot input */}
              <div className="flex items-center gap-1 text-sm flex-shrink-0">
                <span className="text-gray-400 text-xs">Bobot:</span>
                <input
                  type="number"
                  className="w-14 text-right border border-gray-200 rounded px-1 py-0.5 text-sm focus:outline-none focus:border-yellow-400 disabled:bg-gray-50 disabled:cursor-default"
                  value={obj.weight}
                  disabled={isLocked}
                  onChange={(e) => updateObjective(obj.id, { weight: Number(e.target.value) })}
                  onBlur={() => !isLocked && saveObjective(obj)}
                  min={0}
                  max={100}
                />
                <span className="text-gray-400 text-xs">%</span>
              </div>

              {/* Achievement badge */}
              <div className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                achievement >= 100 ? "bg-green-500 text-white" :
                achievement >= 70 ? "bg-yellow-400 text-gray-900" :
                "bg-red-400 text-white"
              }`}>
                {achievement.toFixed(0)}%
              </div>

              {/* Status badge */}
              {isLocked ? (
                <button
                  onClick={() => recallOKR(obj.id)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition flex-shrink-0"
                  title="Tarik kembali ke draft"
                >
                  <RotateCcw size={13} />
                </button>
              ) : (
                <button
                  onClick={() => deleteObjective(obj.id)}
                  className="text-red-400 hover:text-red-600 transition flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Progress bar per objective */}
            <div className="px-4 pt-2 pb-1">
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    achievement >= 100 ? "bg-green-500" : achievement >= 70 ? "bg-yellow-400" : "bg-red-400"
                  }`}
                  style={{ width: `${Math.min(achievement, 100)}%` }}
                />
              </div>
            </div>

            {isExpanded && (
              <div className="p-4 pt-3">
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-xs font-medium ${Math.abs(krTotalWeight - 100) > 0.01 && krTotalWeight > 0 ? "text-red-500" : "text-gray-400"}`}>
                    Bobot KR: {krTotalWeight}% {Math.abs(krTotalWeight - 100) > 0.01 && krTotalWeight > 0 && "(harus 100%)"}
                  </p>
                  {!isLocked && (
                    <button
                      onClick={() => addKeyResult(obj.id)}
                      className="flex items-center gap-1 text-xs text-yellow-600 hover:text-yellow-700 font-semibold"
                    >
                      <Plus size={14} /> Tambah Key Result
                    </button>
                  )}
                </div>

                {obj.keyResults.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">Belum ada key result.</p>
                )}

                <div className="space-y-3">
                  {obj.keyResults.map((kr) => {
                    const pct = calcKRAchievement(kr);
                    const progress = kr.leadProgress ?? kr.teamProgress;
                    return (
                      <div key={kr.id} className={`border rounded-xl p-3 ${isLocked ? "bg-gray-50 border-gray-100" : "bg-gray-50 border-gray-100"}`}>
                        <div className="flex items-start gap-2 mb-2">
                          <input
                            className="flex-1 text-sm text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-yellow-400 focus:outline-none disabled:cursor-default"
                            value={kr.title}
                            disabled={isLocked}
                            onChange={(e) => updateKR(obj.id, kr.id, { title: e.target.value })}
                            onBlur={() => !isLocked && saveKR(kr)}
                            placeholder="Judul Key Result"
                          />
                          {!isLocked && (
                            <button onClick={() => deleteKR(obj.id, kr.id)} className="text-red-400 hover:text-red-600 transition flex-shrink-0">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600 mb-2">
                          <div>
                            <label className="block text-gray-400 mb-0.5">Target</label>
                            <input
                              type="number"
                              className="w-full border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-yellow-400 disabled:bg-white disabled:cursor-default"
                              value={kr.target}
                              disabled={isLocked}
                              onChange={(e) => updateKR(obj.id, kr.id, { target: Number(e.target.value) })}
                              onBlur={() => !isLocked && saveKR(kr)}
                              min={0}
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 mb-0.5">Satuan</label>
                            <select
                              className="w-full border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-yellow-400 bg-white disabled:cursor-default"
                              value={kr.unit}
                              disabled={isLocked}
                              onChange={(e) => updateKR(obj.id, kr.id, { unit: e.target.value })}
                              onBlur={() => !isLocked && saveKR(kr)}
                            >
                              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-gray-400 mb-0.5">Bobot (%)</label>
                            <input
                              type="number"
                              className="w-full border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-yellow-400 disabled:bg-white disabled:cursor-default"
                              value={kr.weight}
                              disabled={isLocked}
                              onChange={(e) => updateKR(obj.id, kr.id, { weight: Number(e.target.value) })}
                              onBlur={() => !isLocked && saveKR(kr)}
                              min={0}
                              max={100}
                            />
                          </div>
                          <div>
                            {/* Progress selalu bisa diisi meski locked */}
                            <label className="block text-gray-400 mb-0.5">Progress</label>
                            <input
                              type="number"
                              className="w-full border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-yellow-400"
                              value={kr.teamProgress}
                              onChange={(e) => updateKR(obj.id, kr.id, { teamProgress: Number(e.target.value) })}
                              onBlur={() => saveKR(kr)}
                              min={0}
                            />
                          </div>
                        </div>

                        {/* Progress bar per KR */}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                            <div
                              className={`h-1.5 rounded-full ${pct >= 100 ? "bg-green-500" : pct >= 70 ? "bg-yellow-400" : "bg-red-400"}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-500 w-10 text-right">{pct.toFixed(0)}%</span>
                        </div>

                        {kr.leadProgress !== null && (
                          <p className="text-xs text-blue-500 mt-1">Lead override: {kr.leadProgress} {kr.unit}</p>
                        )}
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
