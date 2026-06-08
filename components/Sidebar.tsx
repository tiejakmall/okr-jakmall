"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

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
  const navItems =
    role === "ADMIN" ? adminNav : role === "LEAD" ? leadNav : memberNav;

  const roleLabel =
    role === "ADMIN" ? "Admin" : role === "LEAD" ? "Lead Divisi" : "Anggota";
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  function NavLink({ href, label, emoji }: { href: string; label: string; emoji: string }) {
    const active = path.startsWith(href);
    return (
      <Link
        href={href}
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

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-slate-200 flex flex-col">
      {/* Brand */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">📈</span>
          <div>
            <h1 className="text-slate-900 font-bold text-sm leading-tight">OKR Tracker</h1>
            {division && (
              <p className="text-slate-400 text-xs leading-tight mt-0.5">{division}</p>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3">
        <p className="text-slate-400 text-xs uppercase font-semibold tracking-wider px-3 mb-2">
          Menu
        </p>
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>

        {role === "ADMIN" && (
          <>
            <p className="text-slate-400 text-xs uppercase font-semibold tracking-wider px-3 mt-5 mb-2">
              Admin
            </p>
            <div className="space-y-0.5">
              {adminOnlyNav.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
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
}
