"use client";

import { useState } from "react";
import { Plus, Trash2, UserPlus } from "lucide-react";

type Assignment = {
  id: string;
  weight: number;
  objectiveId: string;
  objective: { id: string; title: string };
};

type Member = {
  id: string;
  name: string;
  assignments: Assignment[];
};

type Objective = {
  id: string;
  title: string;
};

type Props = {
  initialMembers: Member[];
  objectives: Objective[];
  leadId: string;
};

function MemberCard({
  member,
  objectives,
  onDelete,
  onAddAssignment,
  onRemoveAssignment,
  onWeightChange,
}: {
  member: Member;
  objectives: Objective[];
  onDelete: (id: string) => void;
  onAddAssignment: (memberId: string, objectiveId: string) => void;
  onRemoveAssignment: (assignmentId: string, memberId: string) => void;
  onWeightChange: (assignmentId: string, memberId: string, weight: number) => void;
}) {
  const totalWeight = member.assignments.reduce((s, a) => s + Number(a.weight), 0);
  const assignedObjectiveIds = new Set(member.assignments.map((a) => a.objectiveId));
  const unassigned = objectives.filter((o) => !assignedObjectiveIds.has(o.id));

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
            Math.abs(totalWeight - 100) < 0.01 ? "bg-green-100 text-green-700" :
            totalWeight > 100 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
          }`}>
            Total: {totalWeight}%{totalWeight === 100 ? " ✓" : " (harus 100%)"}
          </span>
          <button onClick={() => onDelete(member.id)} className="text-red-400 hover:text-red-600 transition">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Progress bar bobot */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all ${totalWeight > 100 ? "bg-red-400" : "bg-yellow-400"}`}
          style={{ width: `${Math.min(totalWeight, 100)}%` }}
        />
      </div>

      {/* Assignments */}
      <div className="space-y-2">
        {member.assignments.map((a) => (
          <div key={a.id} className="flex items-center gap-2 text-sm">
            <div className="flex-1 bg-gray-50 rounded-lg px-3 py-1.5 text-gray-700 truncate">
              {a.objective.title}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <input
                type="number"
                className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-yellow-400"
                value={a.weight}
                min={0}
                max={100}
                onChange={(e) => onWeightChange(a.id, member.id, Number(e.target.value))}
              />
              <span className="text-gray-400 text-xs">%</span>
              <button
                onClick={() => onRemoveAssignment(a.id, member.id)}
                className="text-red-300 hover:text-red-500 transition ml-1"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {/* Add objective dropdown */}
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
      method: "DELETE",
    });
    // re-use upsert via POST
    const member = members.find(m => m.id === memberId);
    const assignment = member?.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, objectiveId: assignment.objectiveId, weight }),
    });
    const updated = await res.json();
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, assignments: m.assignments.map((a) => a.id === assignmentId ? { ...a, id: updated.id, weight } : a) }
          : m
      )
    );
  }

  return (
    <div>
      {/* Add member form */}
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
          />
        ))}
      </div>
    </div>
  );
}
