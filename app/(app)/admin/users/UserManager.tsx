"use client";

import { useState, useRef } from "react";
import { Trash2, Edit2 } from "lucide-react";

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
  LEAD: "bg-amber-100 text-amber-700",
  MEMBER: "bg-slate-100 text-slate-600",
};
const ROLE_EMOJI: Record<string, string> = { ADMIN: "🛡️", LEAD: "⭐", MEMBER: "👤" };

const btnPrimary =
  "flex items-center gap-2 bg-amber-400 text-gray-900 font-bold text-sm px-5 py-2.5 rounded-xl " +
  "shadow-[0_4px_0_#d97706] hover:shadow-[0_2px_0_#d97706] hover:translate-y-0.5 " +
  "active:shadow-[0_1px_0_#d97706] active:translate-y-[3px] transition-all duration-75";

const btnSecondary =
  "flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-xl " +
  "shadow-[0_4px_0_#e2e8f0] hover:shadow-[0_2px_0_#e2e8f0] hover:translate-y-0.5 " +
  "active:shadow-[0_1px_0_#e2e8f0] active:translate-y-[3px] transition-all duration-75";

const inputCls =
  "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white transition";

function UserForm({ form, isEdit, onChange, onSave, onCancel }: {
  form: FormState;
  isEdit: boolean;
  onChange: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-amber-200 p-6 mb-5">
      <h2 className="font-semibold text-slate-800 mb-4">
        {isEdit ? "✏️ Edit Pengguna" : "➕ Pengguna Baru"}
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">👤 Nama</label>
          <input className={inputCls} value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} placeholder="Nama lengkap" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">📧 Email</label>
          <input type="email" className={inputCls} value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} placeholder="email@perusahaan.com" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            🔒 Password{" "}
            {isEdit && <span className="text-slate-400 font-normal">(kosongkan jika tidak diubah)</span>}
          </label>
          <input type="password" className={inputCls} value={form.password} onChange={(e) => onChange({ ...form, password: e.target.value })} placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">🎭 Role</label>
          <select className={inputCls} value={form.role} onChange={(e) => onChange({ ...form, role: e.target.value })}>
            <option value="MEMBER">👤 Member (anggota divisi)</option>
            <option value="LEAD">⭐ Lead Divisi</option>
            <option value="ADMIN">🛡️ Admin (HR)</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            🏢 Divisi
            {form.role === "LEAD" && (
              <span className="text-amber-600 ml-1 font-normal">— Lead & Member dengan nama divisi yang sama akan tergroup</span>
            )}
          </label>
          <input className={inputCls} value={form.division} onChange={(e) => onChange({ ...form, division: e.target.value })} placeholder="contoh: Designer Brand, Content Creator, Visual Designer" />
        </div>
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={onSave} className={btnPrimary}>💾 Simpan</button>
        <button onClick={onCancel} className={btnSecondary}>✕ Batal</button>
      </div>
    </div>
  );
}

export default function UserManager({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ type: "success" | "error"; message: string; errors?: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function cancel() { setShowForm(false); setEditId(null); setForm(emptyForm); }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/users/import", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.success) {
        setImportResult({ type: "success", message: data.message, errors: data.errors });
        const reloaded = await fetch("/api/users").then((r) => r.json());
        setUsers(Array.isArray(reloaded) ? reloaded : []);
      } else {
        setImportResult({ type: "error", message: data.error ?? "Import gagal.", errors: data.errors });
      }
    } catch {
      setImportResult({ type: "error", message: "Terjadi kesalahan jaringan." });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function createUser() {
    if (!form.name || !form.email || !form.password) { alert("Nama, email, dan password wajib diisi."); return; }
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { alert((await res.json()).error ?? "Gagal membuat pengguna"); return; }
    const user = await res.json();
    setUsers((prev) => [...prev, user].sort((a, b) => a.name.localeCompare(b.name)));
    cancel();
  }

  async function updateUser() {
    if (!editId) return;
    const payload: Partial<FormState> = { name: form.name, email: form.email, role: form.role, division: form.division };
    if (form.password) payload.password = form.password;
    const res = await fetch(`/api/users/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
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

  const grouped = users.reduce<Record<string, User[]>>((acc, u) => {
    const key = u.division || "(Tanpa Divisi)";
    if (!acc[key]) acc[key] = [];
    acc[key].push(u);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setShowForm((v) => !v); setEditId(null); setForm(emptyForm); }}
            className={btnPrimary}
          >
            ➕ Tambah Pengguna
          </button>
          <a href="/api/users/import" className={btnSecondary}>📋 Download Template</a>
          <label className={`${btnSecondary} cursor-pointer ${importing ? "opacity-50 pointer-events-none" : ""}`}>
            {importing ? "⏳ Mengimpor..." : "📤 Bulk Import Excel"}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
        </div>
        <p className="text-xs text-slate-400">Download template → isi → upload untuk buat akun massal</p>
      </div>

      {importResult && (
        <div className={`rounded-xl px-4 py-3 text-sm mb-4 ${importResult.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          <p className="font-semibold">{importResult.type === "success" ? "✅" : "❌"} {importResult.message}</p>
          {importResult.errors?.map((e, i) => <p key={i} className="text-xs mt-0.5">{e}</p>)}
        </div>
      )}

      {showForm && <UserForm form={form} isEdit={false} onChange={setForm} onSave={createUser} onCancel={cancel} />}
      {editId && <UserForm form={form} isEdit={true} onChange={setForm} onSave={updateUser} onCancel={cancel} />}

      <div className="space-y-4">
        {Object.entries(grouped).map(([division, divUsers]) => (
          <div key={division} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <span className="text-base">🏢</span>
              <span className="font-semibold text-slate-700 text-sm">{division}</span>
              <span className="text-slate-400 text-xs">({divUsers.length} orang)</span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {divUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 font-medium text-slate-800">{user.name}</td>
                    <td className="px-5 py-3 text-slate-500">{user.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-600"}`}>
                        {ROLE_EMOJI[user.role]} {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(user)}
                          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100
                            shadow-[0_2px_0_#e2e8f0] hover:shadow-[0_1px_0_#e2e8f0] hover:translate-y-px
                            active:shadow-none active:translate-y-[2px] transition-all duration-75"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50
                            shadow-[0_2px_0_#e2e8f0] hover:shadow-[0_1px_0_#fecaca] hover:translate-y-px
                            active:shadow-none active:translate-y-[2px] transition-all duration-75"
                        >
                          <Trash2 size={13} />
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
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-slate-500 text-sm">Belum ada pengguna. Klik "Tambah Pengguna" untuk mulai.</p>
          </div>
        )}
      </div>
    </div>
  );
}
