"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronDown, ChevronUp, Save, Edit2 } from "lucide-react";

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
  keyResults: KeyResult[];
};

type Props = {
  initialObjectives: Objective[];
  quarterId: string;
  userId: string;
};

const UNITS = ["%", "pcs", "x", "score", "hari", "bulan", "orang", "lainnya"];

export default function OKRManager({ initialObjectives, quarterId, userId }: Props) {
  const router = useRouter();
  const [objectives, setObjectives] = useState<Objective[]>(initialObjectives);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

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
    router.refresh();
  }

  async function deleteObjective(id: string) {
    if (!confirm("Hapus objective ini beserta semua key result-nya?")) return;
    await fetch(`/api/objectives/${id}`, { method: "DELETE" });
    setObjectives((prev) => prev.filter((o) => o.id !== id));
  }

  async function addKeyResult(objectiveId: string) {
    const res = await fetch("/api/key-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Key Result baru",
        target: 100,
        unit: "%",
        weight: 0,
        objectiveId,
      }),
    });
    const kr = await res.json();
    setObjectives((prev) =>
      prev.map((o) =>
        o.id === objectiveId ? { ...o, keyResults: [...o.keyResults, kr] } : o
      )
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
    router.refresh();
  }

  async function deleteKR(objectiveId: string, krId: string) {
    if (!confirm("Hapus key result ini?")) return;
    await fetch(`/api/key-results/${krId}`, { method: "DELETE" });
    setObjectives((prev) =>
      prev.map((o) =>
        o.id === objectiveId
          ? { ...o, keyResults: o.keyResults.filter((kr) => kr.id !== krId) }
          : o
      )
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className={`text-sm font-medium ${Math.abs(totalWeight - 100) > 0.01 && totalWeight > 0 ? "text-red-500" : "text-gray-500"}`}>
          Total bobot objective: <span className="font-bold">{totalWeight}%</span>
          {Math.abs(totalWeight - 100) > 0.01 && totalWeight > 0 && " (harus 100%)"}
        </div>
        <button
          onClick={addObjective}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} /> Tambah Objective
        </button>
      </div>

      {objectives.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-400">
          Belum ada objective. Klik "Tambah Objective" untuk mulai.
        </div>
      )}

      {objectives.map((obj) => {
        const krTotalWeight = obj.keyResults.reduce((s, kr) => s + Number(kr.weight), 0);
        const isExpanded = expanded[obj.id] ?? false;

        return (
          <div key={obj.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b">
              <button
                onClick={() => setExpanded((p) => ({ ...p, [obj.id]: !p[obj.id] }))}
                className="text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              <input
                className="flex-1 font-semibold text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-yellow-400 focus:outline-none bg-transparent py-0.5 text-sm"
                value={obj.title}
                onChange={(e) => updateObjective(obj.id, { title: e.target.value })}
                onBlur={() => saveObjective(obj)}
              />

              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-400 text-xs">Bobot:</span>
                <input
                  type="number"
                  className="w-16 text-right border border-gray-200 rounded px-1 py-0.5 text-sm focus:outline-none focus:border-yellow-400"
                  value={obj.weight}
                  onChange={(e) => updateObjective(obj.id, { weight: Number(e.target.value) })}
                  onBlur={() => saveObjective(obj)}
                  min={0}
                  max={100}
                />
                <span className="text-gray-400 text-xs">%</span>
              </div>

              <button
                onClick={() => deleteObjective(obj.id)}
                className="text-red-400 hover:text-red-600 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {isExpanded && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-xs font-medium ${Math.abs(krTotalWeight - 100) > 0.01 && krTotalWeight > 0 ? "text-red-500" : "text-gray-400"}`}>
                    Total bobot KR: {krTotalWeight}%{" "}
                    {Math.abs(krTotalWeight - 100) > 0.01 && krTotalWeight > 0 && "(harus 100%)"}
                  </p>
                  <button
                    onClick={() => addKeyResult(obj.id)}
                    className="flex items-center gap-1 text-xs text-yellow-600 hover:text-yellow-700 font-semibold"
                  >
                    <Plus size={14} /> Tambah Key Result
                  </button>
                </div>

                {obj.keyResults.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">
                    Belum ada key result.
                  </p>
                )}

                <div className="space-y-3">
                  {obj.keyResults.map((kr) => (
                    <div key={kr.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                      <div className="flex items-start gap-2 mb-2">
                        <input
                          className="flex-1 text-sm text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-yellow-400 focus:outline-none"
                          value={kr.title}
                          onChange={(e) => updateKR(obj.id, kr.id, { title: e.target.value })}
                          onBlur={() => saveKR(kr)}
                          placeholder="Judul Key Result"
                        />
                        <button
                          onClick={() => deleteKR(obj.id, kr.id)}
                          className="text-red-400 hover:text-red-600 transition flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                        <div>
                          <label className="block text-gray-400 mb-0.5">Target</label>
                          <input
                            type="number"
                            className="w-full border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-yellow-400"
                            value={kr.target}
                            onChange={(e) => updateKR(obj.id, kr.id, { target: Number(e.target.value) })}
                            onBlur={() => saveKR(kr)}
                            min={0}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-0.5">Satuan</label>
                          <select
                            className="w-full border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-yellow-400 bg-white"
                            value={kr.unit}
                            onChange={(e) => updateKR(obj.id, kr.id, { unit: e.target.value })}
                            onBlur={() => saveKR(kr)}
                          >
                            {UNITS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-0.5">Bobot (%)</label>
                          <input
                            type="number"
                            className="w-full border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-yellow-400"
                            value={kr.weight}
                            onChange={(e) => updateKR(obj.id, kr.id, { weight: Number(e.target.value) })}
                            onBlur={() => saveKR(kr)}
                            min={0}
                            max={100}
                          />
                        </div>
                        <div>
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

                      {kr.leadProgress !== null && (
                        <p className="text-xs text-blue-500 mt-1">
                          Lead override: {kr.leadProgress} {kr.unit}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {saving && <p className="text-xs text-gray-400 mt-2 text-right">Menyimpan...</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
