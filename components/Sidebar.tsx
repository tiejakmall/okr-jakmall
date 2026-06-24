"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const memberNav = [
  { href: "/dashboard", label: "Dashboard", emoji: "📊" },
];

const leadNav = [
  { href: "/dashboard", label: "Dashboard Divisi", emoji: "📊" },
  { href: "/okr", label: "OKR Divisi", emoji: "🎯" },
  { href: "/distribusi", label: "Distribusi Anggota", emoji: "👥" },
];

const adminNav = [
  { href: "/dashboard", label: "Dashboard", emoji: "📊" },
];

const adminOnlyNav = [
  { href: "/admin/quarters", label: "Quarter", emoji: "⏱️" },
  { href: "/admin/divisions", label: "Divisi", emoji: "🏢" },
  { href: "/admin/users", label: "Pengguna", emoji: "👥" },
  { href: "/admin/employees", label: "Karyawan", emoji: "🧑‍💼" },
  { href: "/admin/reminders", label: "Reminder", emoji: "🔔" },
];

export default function Sidebar({
  role,
  name,
  division,
}: {
  role: string;
  name?: string | null;
  division?: string | null;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const navItems = role === "ADMIN" ? adminNav : role === "LEAD" ? leadNav : memberNav;
  const roleLabel = role === "ADMIN" ? "Admin" : role === "LEAD" ? "Lead Divisi" : "Anggota";
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  function NavLink({ href, label, emoji }: { href: string; label: string; emoji: string }) {
    const active = path.startsWith(href);
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-100 ${
          active
            ? "bg-amber-50 text-amber-700 shadow-[inset_0_0_0_1.5px_#fde68a]"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <span className="text-base leading-none">{emoji}</span>
        <span>{label}</span>
      </Link>
    );
  }

  const sidebarContent = (
    <aside className="w-56 min-h-screen bg-white border-r border-slate-200 flex flex-col">
      <div className="px-4 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">📈</span>
          <div>
            <h1 className="text-slate-900 font-bold text-sm leading-tight">OKR Tracker</h1>
            {division && <p className="text-slate-400 text-xs leading-tight mt-0.5">{division}</p>}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3">
        <p className="text-slate-400 text-xs uppercase font-semibold tracking-wider px-3 mb-2">Menu</p>
        <div className="space-y-0.5">
          {navItems.map((item) => <NavLink key={item.href} {...item} />)}
        </div>

        {role === "ADMIN" && (
          <>
            <p className="text-slate-400 text-xs uppercase font-semibold tracking-wider px-3 mt-5 mb-2">Admin</p>
            <div className="space-y-0.5">
              {adminOnlyNav.map((item) => <NavLink key={item.href} {...item} />)}
            </div>
          </>
        )}
      </nav>

      <div className="px-3 pb-4 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-slate-800 text-xs font-semibold truncate">{name}</p>
            <p className="text-slate-400 text-xs">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 w-full transition-all duration-100"
        >
          <span>🚪</span>
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">{sidebarContent}</div>

      {/* Mobile hamburger */}
      <div className="lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-white border border-slate-200 rounded-xl shadow-sm"
        >
          <Menu size={18} className="text-slate-600" />
        </button>

        {/* Overlay */}
        {open && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="fixed inset-y-0 left-0 z-50 flex">
              {sidebarContent}
              <button onClick={() => setOpen(false)} className="absolute top-4 right-3 p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
