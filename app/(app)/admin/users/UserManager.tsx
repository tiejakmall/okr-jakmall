"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  division: string | null;
  createdAt: string;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  role: string;
  division: string;
};

const emptyForm: FormState = { name: "", email: "", password: "", role: "MEMBER", division: "" };

const ROLE_LABELS: Record<string, string> = { ADMIN: "Admin", LEAD: "Lead Divisi", MEMBER: "Member" };
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  LEAD: "bg-yellow-100 text-yellow-700",
  MEMBER: "bg-gray-100 text-gray-600",
};

/* ── Form dipisah jadi komponen sendiri di luar UserManager ── */
function UserForm({
  form,
  isEdit,
  onChange,
  onSave,
  onCancel,
}: {
  form: FormState;
  isEdit: boolean;
  onChange: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-2 border-yellow-200">
      <h2 className="font-semibold text-gray-800 mb-4">
        {isEdit ? "Edit Pengguna" : "Pengguna Baru"}
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nama</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="Nama lengkap"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Email</label>
          <input
            type="email"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
            value={form.email}
            onChange={(e) => onChange({ ...form, email: e.target.value })}
            placeholder="email@perusahaan.com"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Password{" "}
            {isEdit && <span className="text-gray-400">(kosongkan jika tidak diubah)</span>}
          </label>
          <input
            type="password"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
            value={form.password}
            onChange={(e) => onChange({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Role</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 bg-white"
            value={form.role}
            onChange={(e) => onChange({ ...form, role: e.target.value })}
          >
            <option value="MEMBER">Member (anggota divisi)</option>
            <option value="LEAD">Lead Divisi</option>
            <option value="ADMIN">Admin (HR)</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">
            Divisi
            {form.role === "LEAD" && (
              <span className="text-yellow-600 ml-1">
                — Lead & Member dengan nama divisi yang sama akan tergroup
              </span>
            )}
          </label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
            value={form.division}
            onChange={(e) => onChange({ ...form, division: e.target.value })}
            placeholder="contoh: Designer Brand, Content Creator, Visual Designer"
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={onSave}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg transition"
        >
          Simpan
        </button>
        <button
          onClick={onCancel}
          className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function UserManager({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  function cancel() {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  }

  async function createUser() {
    if (!form.name || !form.email || !form.password) {
      alert("Nama, email, dan password wajib diisi.");
      return;
    }
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { alert((await res.json()).error ?? "Gagal membuat pengguna"); return; }
    const user = await res.json();
    setUsers((prev) => [...prev, user].sort((a, b) => a.name.localeCompare(b.name)));
    cancel();
  }

  async function updateUser() {
    if (!editId) return;
    const payload: Partial<FormState> = {
      name: form.name,
      email: form.email,
      role: form.role,
      division: form.division,
    };
    if (form.password) payload.password = form.password;
    const res = await fetch(`/api/users/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const updated = await res.json();
    setUsers((prev) => prev.map((u) => (u.id === editId ? updated : u)));
    cancel();
  }

  async function deleteUser(id: string) {
    if (!confirm("Hapus pengguna ini? Semua OKR mereka akan terhapus.")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  function startEdit(user: User) {
    setEditId(user.id);
    setShowForm(false);
    setForm({ name: user.name, email: user.email, password: "", role: user.role, division: user.division ?? "" });
  }

  // Group users by division
  const grouped = users.reduce<Record<string, User[]>>((acc, u) => {
    const key = u.division || "(Tanpa Divisi)";
    if (!acc[key]) acc[key] = [];
    acc[key].push(u);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setShowForm((v) => !v); setEditId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} /> Tambah Pengguna
        </button>
      </div>

      {showForm && (
        <UserForm
          form={form}
          isEdit={false}
          onChange={setForm}
          onSave={createUser}
          onCancel={cancel}
        />
      )}

      {editId && (
        <UserForm
          form={form}
          isEdit={true}
          onChange={setForm}
          onSave={updateUser}
          onCancel={cancel}
        />
      )}

      <div className="space-y-4">
        {Object.entries(grouped).map(([division, divUsers]) => (
          <div key={division} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2">
              <span className="font-semibold text-gray-700 text-sm">{division}</span>
              <span className="text-gray-400 text-xs">({divUsers.length} orang)</span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {divUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(user)} className="text-gray-400 hover:text-gray-700 transition">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => deleteUser(user.id)} className="text-red-400 hover:text-red-600 transition">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {users.length === 0 && (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-400">
            Belum ada pengguna. Klik "Tambah Pengguna" untuk mulai.
          </div>
        )}
      </div>
    </div>
  );
}
