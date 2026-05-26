"use client";

import { useState } from "react";
import { Trash2, UserPlus, ChevronDown, ChevronUp } from "lucide-react";

type KRAssignment = {
  id: string;
  weight: number;
  progress: number;
  keyResultId: string;
};

type Assignment = {
  id: string;
  weight: number;
  objectiveId: string;
  objective: { id: string; title: string };
  krAssignments: KRAssignment[];
};

type Member = {
  id: string;
  name: string;
  assignments: Assignment[];
};

type KeyResult = {
  id: string;
  title: string;
  target: number;
  unit: string;
};

type Objective = {
  id: string;
  title: string;
  keyResults: KeyResult[];
};

type Props = {
  initialMembers: Member[];
  objectives: Objective[];
  leadId: string;
};

// ─── KR row: weight + progress ────────────────────────────────────────────────
function KRRow({
  kra,
  kr,
  onWeightChange,
  onProgressChange,
  onRemove,
}: {
  kra: KRAssignment;
  kr: KeyResult;
  onWeightChange: (id: string, val: number) => void;
  onProgressChange: (id: string, val: number) => void;
  onRemove: (id: string) => void;
}) {
  const pct = kr.target > 0 ? Math.min((kra.progress / kr.target) * 100, 100) : 0;

  return (
    <div className="pl-2 border-l-2 border-gray-200 space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <span className="flex-1 text-gray-600 truncate font-medium">{kr.title}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-gray-400">Bobot</span>
          <input
            type="number"
            className="w-12 border border-gray-200 rounded px-1.5 py-0.5 text-xs text-right focus:outline-none focus:border-yellow-400"
            value={kra.weight}
            min={0} max={100} step={1}
            onChange={(e) => onWeightChange(kra.id, Number(e.target.value))}
          />
          <span className="text-gray-400">%</span>
        </div>
        <button onClick={() => onRemove(kra.id)} className="text-red-300 hover:text-red-500 transition ml-1">
          <Trash2 size={12} />
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-400 flex-shrink-0">Progress</span>
        <input
          type="number"
          className="w-20 border border-gray-200 rounded px-1.5 py-0.5 text-xs text-right focus:outline-none focus:border-yellow-400"
          value={kra.progress}
          min={0}
          onChange={(e) => onProgressChange(kra.id, Number(e.target.value))}
        />
        <span className="text-gray-400">/ {kr.target} {kr.unit}</span>
        <span className={`ml-auto font-semibold ${pct >= 100 ? "text-green-600" : pct >= 70 ? "text-yellow-600" : "text-red-500"}`}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-1 rounded-full transition-all ${pct >= 100 ? "bg-green-500" : pct >= 70 ? "bg-yellow-400" : "bg-red-400"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Objective assignment row ─────────────────────────────────────────────────
function AssignmentRow({
  assignment,
  objectives,
  onRemove,
  onWeightChange,
  onAddKR,
  onRemoveKR,
  onKRWeightChange,
  onKRProgressChange,
}: {
  assignment: Assignment;
  objectives: Objective[];
  onRemove: (id: string) => void;
  onWeightChange: (id: string, val: number) => void;
  onAddKR: (assignmentId: string, keyResultId: string) => void;
  onRemoveKR: (kraId: string, assignmentId: string) => void;
  onKRWeightChange: (kraId: string, assignmentId: string, val: number) => void;
  onKRProgressChange: (kraId: string, assignmentId: string, val: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const obj = objectives.find((o) => o.id === assignment.objectiveId);
  const allKRs = obj?.keyResults ?? [];
  const assignedKRIds = new Set(assignment.krAssignments.map((kra) => kra.keyResultId));
  const unassignedKRs = allKRs.filter((kr) => !assignedKRIds.has(kr.id));

  const krTotal = assignment.krAssignments.reduce((s, kra) => s + Number(kra.weight), 0);
  const krOk = assignment.krAssignments.length > 0 && Math.abs(krTotal - 100) < 0.1;

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5 space-y-2">
      {/* Objective header row */}
      <div className="flex items-center gap-2 text-sm">
        <span className="flex-1 font-semibold text-gray-700 truncate">{assignment.objective.title}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-gray-400">Bobot</span>
          <input
            type="number"
            className="w-14 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-yellow-400 bg-white"
            value={assignment.weight}
            min={0} max={100}
            onChange={(e) => onWeightChange(assignment.id, Number(e.target.value))}
          />
          <span className="text-xs text-gray-400">%</span>
        </div>
        <button onClick={() => onRemove(assignment.id)} className="text-red-300 hover:text-red-500 transition">
          <Trash2 size={13} />
        </button>
      </div>

      {/* KR section toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition w-full text-left"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        <span>Key Results ({assignment.krAssignments.length} dipilih)</span>
        {assignment.krAssignments.length > 0 && (
          <span className={`ml-1 font-semibold ${krOk ? "text-green-600" : "text-red-500"}`}>
            · bobot {krTotal.toFixed(0)}%{krOk ? " ✓" : " (harus 100%)"}
          </span>
        )}
      </button>

      {open && (
        <div className="space-y-2 pl-1">
          {/* Assigned KRs */}
          {assignment.krAssignments.map((kra) => {
            const kr = allKRs.find((k) => k.id === kra.keyResultId);
            return kr ? (
              <KRRow
                key={kra.id}
                kra={kra}
                kr={kr}
                onWeightChange={(id, val) => onKRWeightChange(id, assignment.id, val)}
                onProgressChange={(id, val) => onKRProgressChange(id, assignment.id, val)}
                onRemove={(id) => onRemoveKR(id, assignment.id)}
              />
            ) : null;
          })}

          {/* Add KR dropdown */}
          {unassignedKRs.length > 0 && (
            <select
              className="w-full border border-dashed border-gray-300 rounded px-2 py-1 text-xs text-gray-400 focus:outline-none focus:border-yellow-400 bg-white"
              value=""
              onChange={(e) => { if (e.target.value) onAddKR(assignment.id, e.target.value); }}
            >
              <option value="">+ Pilih Key Result...</option>
              {unassignedKRs.map((kr) => (
                <option key={kr.id} value={kr.id}>{kr.title}</option>
              ))}
            </select>
          )}

          {allKRs.length === 0 && (
            <p className="text-xs text-gray-400 italic">Objective ini belum punya Key Result.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Member card ──────────────────────────────────────────────────────────────
function MemberCard({
  member,
  objectives,
  onDelete,
  onAddAssignment,
  onRemoveAssignment,
  onWeightChange,
  onAddKR,
  onRemoveKR,
  onKRWeightChange,
  onKRProgressChange,
}: {
  member: Member;
  objectives: Objective[];
  onDelete: (id: string) => void;
  onAddAssignment: (memberId: string, objectiveId: string) => void;
  onRemoveAssignment: (assignmentId: string, memberId: string) => void;
  onWeightChange: (assignmentId: string, memberId: string, val: number) => void;
  onAddKR: (assignmentId: string, memberId: string, keyResultId: string) => void;
  onRemoveKR: (kraId: string, assignmentId: string, memberId: string) => void;
  onKRWeightChange: (kraId: string, assignmentId: string, memberId: string, val: number) => void;
  onKRProgressChange: (kraId: string, assignmentId: string, memberId: string, val: number) => void;
}) {
  const totalWeight = member.assignments.reduce((s, a) => s + Number(a.weight), 0);
  const assignedObjectiveIds = new Set(member.assignments.map((a) => a.objectiveId));
  const unassigned = objectives.filter((o) => !assignedObjectiveIds.has(o.id));
  const objOk = Math.abs(totalWeight - 100) < 0.1;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-sm">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-gray-800">{member.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            objOk ? "bg-green-100 text-green-700" :
            totalWeight > 100 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
          }`}>
            {totalWeight}%{objOk ? " ✓" : " (harus 100%)"}
          </span>
          <button onClick={() => onDelete(member.id)} className="text-red-400 hover:text-red-600 transition">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all ${totalWeight > 100 ? "bg-red-400" : "bg-yellow-400"}`}
          style={{ width: `${Math.min(totalWeight, 100)}%` }}
        />
      </div>

      <div className="space-y-2">
        {member.assignments.map((a) => (
          <AssignmentRow
            key={a.id}
            assignment={a}
            objectives={objectives}
            onRemove={(id) => onRemoveAssignment(id, member.id)}
            onWeightChange={(id, val) => onWeightChange(id, member.id, val)}
            onAddKR={(assignmentId, krId) => onAddKR(assignmentId, member.id, krId)}
            onRemoveKR={(kraId, assignmentId) => onRemoveKR(kraId, assignmentId, member.id)}
            onKRWeightChange={(kraId, assignmentId, val) => onKRWeightChange(kraId, assignmentId, member.id, val)}
            onKRProgressChange={(kraId, assignmentId, val) => onKRProgressChange(kraId, assignmentId, member.id, val)}
          />
        ))}

        {unassigned.length > 0 && (
          <select
            className="w-full border border-dashed border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-400 focus:outline-none focus:border-yellow-400 bg-white"
            value=""
            onChange={(e) => { if (e.target.value) onAddAssignment(member.id, e.target.value); }}
          >
            <option value="">+ Tambah objective...</option>
            {unassigned.map((o) => (
              <option key={o.id} value={o.id}>{o.title}</option>
            ))}
          </select>
        )}

        {objectives.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">Buat objective dulu di atas.</p>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DistribusiAnggota({ initialMembers, objectives, leadId }: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function addMember() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    const res = await fetch("/api/team-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, leadId }),
    });
    const m = await res.json();
    setMembers((prev) => [...prev, { ...m, assignments: [] }]);
    setNewName("");
    setSaving(false);
  }

  async function deleteMember(id: string) {
    if (!confirm("Hapus anggota ini beserta semua assignment-nya?")) return;
    await fetch(`/api/team-members/${id}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function addAssignment(memberId: string, objectiveId: string) {
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, objectiveId, weight: 0 }),
    });
    const a = await res.json();
    const obj = objectives.find((o) => o.id === objectiveId);
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, assignments: [...m.assignments, { ...a, objective: obj!, krAssignments: [] }] }
          : m
      )
    );
  }

  async function removeAssignment(assignmentId: string, memberId: string) {
    await fetch(`/api/assignments/${assignmentId}`, { method: "DELETE" });
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, assignments: m.assignments.filter((a) => a.id !== assignmentId) }
          : m
      )
    );
  }

  async function updateWeight(assignmentId: string, memberId: string, weight: number) {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, assignments: m.assignments.map((a) => a.id === assignmentId ? { ...a, weight } : a) }
          : m
      )
    );
    await fetch(`/api/assignments/${assignmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight }),
    });
  }

  async function addKR(assignmentId: string, memberId: string, keyResultId: string) {
    const res = await fetch("/api/kr-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId, keyResultId, weight: 0, progress: 0 }),
    });
    const kra = await res.json();
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              assignments: m.assignments.map((a) =>
                a.id === assignmentId
                  ? { ...a, krAssignments: [...a.krAssignments, kra] }
                  : a
              ),
            }
          : m
      )
    );
  }

  async function removeKR(kraId: string, assignmentId: string, memberId: string) {
    await fetch(`/api/kr-assignments/${kraId}`, { method: "DELETE" });
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              assignments: m.assignments.map((a) =>
                a.id === assignmentId
                  ? { ...a, krAssignments: a.krAssignments.filter((kra) => kra.id !== kraId) }
                  : a
              ),
            }
          : m
      )
    );
  }

  async function updateKRWeight(kraId: string, assignmentId: string, memberId: string, weight: number) {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              assignments: m.assignments.map((a) =>
                a.id === assignmentId
                  ? { ...a, krAssignments: a.krAssignments.map((kra) => kra.id === kraId ? { ...kra, weight } : kra) }
                  : a
              ),
            }
          : m
      )
    );
    await fetch(`/api/kr-assignments/${kraId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight }),
    });
  }

  async function updateKRProgress(kraId: string, assignmentId: string, memberId: string, progress: number) {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              assignments: m.assignments.map((a) =>
                a.id === assignmentId
                  ? { ...a, krAssignments: a.krAssignments.map((kra) => kra.id === kraId ? { ...kra, progress } : kra) }
                  : a
              ),
            }
          : m
      )
    );
    await fetch(`/api/kr-assignments/${kraId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    });
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
          placeholder="Nama anggota (tidak perlu punya akun)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addMember(); }}
        />
        <button
          onClick={addMember}
          disabled={saving || !newName.trim()}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg transition"
        >
          <UserPlus size={15} /> Tambah Anggota
        </button>
      </div>

      {members.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
          Belum ada anggota. Tambah nama anggota di atas.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {members.map((m) => (
          <MemberCard
            key={m.id}
            member={m}
            objectives={objectives}
            onDelete={deleteMember}
            onAddAssignment={addAssignment}
            onRemoveAssignment={removeAssignment}
            onWeightChange={updateWeight}
            onAddKR={addKR}
            onRemoveKR={removeKR}
            onKRWeightChange={updateKRWeight}
            onKRProgressChange={updateKRProgress}
          />
        ))}
      </div>
    </div>
  );
}
