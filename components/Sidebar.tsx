"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Target, Settings, Users, LogOut, ChevronRight, Shield } from "lucide-react";

const memberNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/okr", label: "OKR Saya", icon: Target },
];

const leadNav = [
  { href: "/dashboard", label: "Dashboard Divisi", icon: LayoutDashboard },
  { href: "/okr", label: "OKR Divisi", icon: Target },
];

const adminNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const adminOnlyNav = [
  { href: "/admin/quarters", label: "Quarter", icon: Settings },
  { href: "/admin/users", label: "Pengguna", icon: Users },
];

export default function Sidebar({ role, name, division }: { role: string; name?: string | null; division?: string | null }) {
  const path = usePathname();

  const navItems = role === "ADMIN" ? adminNav : role === "LEAD" ? leadNav : memberNav;

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const active = path.startsWith(href);
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
          active ? "bg-yellow-400 text-gray-900 font-semibold" : "text-gray-300 hover:bg-gray-800"
        }`}
      >
        <Icon size={16} />
        {label}
        {active && <ChevronRight size={14} className="ml-auto" />}
      </Link>
    );
  }

  return (
    <aside className="w-56 min-h-screen bg-gray-900 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-700">
        <h1 className="text-yellow-400 font-bold text-lg">OKR Tracker</h1>
        {division && <p className="text-gray-400 text-xs mt-0.5">{division}</p>}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => <NavLink key={item.href} {...item} />)}

        {role === "ADMIN" && (
          <>
            <p className="text-gray-500 text-xs uppercase px-3 pt-4 pb-1 font-semibold tracking-wider">Admin</p>
            {adminOnlyNav.map((item) => <NavLink key={item.href} {...item} />)}
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-gray-700">
        <div className="px-3 py-2 mb-1">
          <p className="text-gray-300 text-xs font-medium truncate">{name}</p>
          <p className="text-gray-500 text-xs flex items-center gap-1">
            <Shield size={10} />
            {role === "ADMIN" ? "Admin" : role === "LEAD" ? "Lead" : "Member"}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 w-full transition"
        >
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </aside>
  );
}
