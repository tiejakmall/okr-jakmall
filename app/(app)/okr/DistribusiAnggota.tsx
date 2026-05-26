"use client";

import { useState } from "react";
import { Trash2, UserPlus, ChevronDown, ChevronUp } from "lucide-react";

type KRAssignment = {
  id: string;
  weight: number;
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

// ─── KR weight row ────────────────────────────────────────────────────────────
function KRWeightRow({
  kra,
  krTitle,
  onChange,
}: {
  kra: KRAssignment;
  krTitle: string;
  onChange: (id: string, weight: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="flex-1 text-gray-500 truncate pl-2 border-l-2 border-gray-200">
        {krTitle}
      </span>
      <input
        type="number"
        className="w-14 border border-gray-200 rounded px-1.5 py-0.5 text-xs text-right focus:outline-none focus:border-yellow-400"
        value={kra.weight}
        min={0}
        max={100}
        step={1}
        onChange={(e) => onChange(kra.id, Number(e.target.value))}
      />
      <span className="text-gray-400 w-3">%</span>
    </div>
  );
}

// ─── Objective assignment row (with collapsible KRs) ─────────────────────────
function AssignmentRow({
  assignment,
  objectives,
  onRemove,
  onWeightChange,
  onKRWeightChange,
}: {
  assignment: Assignment;
  objectives: Objective[];
  onRemove: (id: string) => void;
  onWeightChange: (id: string, weight: number) => void;
  onKRWeightChange: (kraId: string, assignmentId: string, weight: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const obj = objectives.find((o) => o.id === assignment.objectiveId);
  const krs = obj?.keyResults ?? [];

  const krTotal = assignment.krAssignments.reduce((s, kra) => s + Number(kra.weight), 0);
  const krOk = Math.abs(krTotal - 100) < 0.1;

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 space-y-1.5">
      {/* Objective row */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex-1 font-medium text-gray-700 truncate">
          {assignment.objective.title}
        </div>
        <input
          type="number"
          className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-yellow-400 bg-white"
          value={assignment.weight}
          min={0}
          max={100}
          onChange={(e) => onWeightChange(assignment.id, Number(e.target.value))}
        />
        <span className="text-gray-400 text-xs">%</span>
        <button onClick={() => onRemove(assignment.id)} className="text-red-300 hover:text-red-500 transition">
          <Trash2 size={13} />
        </button>
      </div>

      {/* KR section */}
      {krs.length > 0 && (
        <>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition w-full text-left"
          >
            {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            <span>Key Results</span>
            <span className={`ml-1 font-semibold ${krOk ? "text-green-600" : "text-red-500"}`}>
              ({krTotal.toFixed(0)}%{krOk ? " ✓" : " — harus 100%"})
            </span>
          </button>

          {open && (
            <div className="space-y-1 pl-1">
              {/* KR progress bar */}
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-1 rounded-full transition-all ${krTotal > 100 ? "bg-red-400" : "bg-yellow-400"}`}
                  style={{ width: `${Math.min(krTotal, 100)}%` }}
                />
              </div>
              {assignment.krAssignments.map((kra) => {
                const kr = krs.find((k) => k.id === kra.keyResultId);
                return kr ? (
                  <KRWeightRow
                    key={kra.id}
                    kra={kra}
                    krTitle={kr.title}
                    onChange={(kraId, w) => onKRWeightChange(kraId, assignment.id, w)}
                  />
                ) : null;
              })}
            </div>
          )}
        </>
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
  onKRWeightChange,
}: {
  member: Member;
  objectives: Objective[];
  onDelete: (id: string) => void;
  onAddAssignment: (memberId: string, objectiveId: string) => void;
  onRemoveAssignment: (assignmentId: string, memberId: string) => void;
  onWeightChange: (assignmentId: string, memberId: string, weight: number) => void;
  onKRWeightChange: (kraId: string, assignmentId: string, memberId: string, weight: number) => void;
}) {
  const totalWeight = member.assignments.reduce((s, a) => s + Number(a.weight), 0);
  const assignedObjectiveIds = new Set(member.assignments.map((a) => a.objectiveId));
  const unassigned = objectives.filter((o) => !assignedObjectiveIds.has(o.id));
  const objOk = Math.abs(totalWeight - 100) < 0.1;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      {/* Header */}
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

      {/* Objective progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all ${totalWeight > 100 ? "bg-red-400" : "bg-yellow-400"}`}
          style={{ width: `${Math.min(totalWeight, 100)}%` }}
        />
      </div>

      {/* Assignments */}
      <div className="space-y-2">
        {member.assignments.map((a) => (
          <AssignmentRow
            key={a.id}
            assignment={a}
            objectives={objectives}
            onRemove={(id) => onRemoveAssignment(id, member.id)}
            onWeightChange={(id, w) => onWeightChange(id, member.id, w)}
            onKRWeightChange={(kraId, assignmentId, w) => onKRWeightChange(kraId, assignmentId, member.id, w)}
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
          ? { ...m, assignments: [...m.assignments, { ...a, objective: obj! }] }
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

  async function updateKRWeight(kraId: string, assignmentId: string, memberId: string, weight: number) {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              assignments: m.assignments.map((a) =>
                a.id === assignmentId
                  ? {
                      ...a,
                      krAssignments: a.krAssignments.map((kra) =>
                        kra.id === kraId ? { ...kra, weight } : kra
                      ),
                    }
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
            onKRWeightChange={updateKRWeight}
          />
        ))}
      </div>
    </div>
  );
}
