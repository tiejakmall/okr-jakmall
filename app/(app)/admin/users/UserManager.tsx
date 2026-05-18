"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, X, Check } from "lucide-react";

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

export default function UserManager({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  async function createUser() {
    if (!form.name || !form.email || !form.password) return;
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error ?? "Gagal membuat pengguna");
      return;
    }
    const user = await res.json();
    setUsers((prev) => [...prev, user].sort((a, b) => a.name.localeCompare(b.name)));
    setShowForm(false);
    setForm(emptyForm);
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
    setEditId(null);
    setForm(emptyForm);
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

  const FormPanel = ({ isEdit }: { isEdit: boolean }) => (
    <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-2 border-yellow-200">
      <h2 className="font-semibold text-gray-800 mb-4">{isEdit ? "Edit Pengguna" : "Pengguna Baru"}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nama</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Email</label>
          <input
            type="email"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Password {isEdit && <span className="text-gray-400">(kosongkan jika tidak diubah)</span>}
          </label>
          <input
            type="password"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={isEdit ? "••••••••" : ""}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Divisi</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
            value={form.division}
            onChange={(e) => setForm({ ...form, division: e.target.value })}
            placeholder="contoh: Designer Brand"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Role</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 bg-white"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={isEdit ? updateUser : createUser}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg transition"
        >
          Simpan
        </button>
        <button
          onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
          className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition"
        >
          Batal
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} /> Tambah Pengguna
        </button>
      </div>

      {showForm && <FormPanel isEdit={false} />}
      {editId && <FormPanel isEdit={true} />}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Nama</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Divisi</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                <td className="px-4 py-3 text-gray-500">{user.email}</td>
                <td className="px-4 py-3 text-gray-500">{user.division ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.role === "ADMIN" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                    {user.role}
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
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  Belum ada pengguna.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
