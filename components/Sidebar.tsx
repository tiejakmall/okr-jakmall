"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Target, Settings, Users, LogOut, ChevronRight } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/okr", label: "OKR Saya", icon: Target },
];

const adminItems = [
  { href: "/admin/quarters", label: "Quarter", icon: Settings },
  { href: "/admin/users", label: "Pengguna", icon: Users },
];

export default function Sidebar({ role }: { role: string }) {
  const path = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-gray-900 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-700">
        <h1 className="text-yellow-400 font-bold text-lg">OKR Tracker</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              path.startsWith(href)
                ? "bg-yellow-400 text-gray-900 font-semibold"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Icon size={16} />
            {label}
            {path.startsWith(href) && <ChevronRight size={14} className="ml-auto" />}
          </Link>
        ))}

        {role === "ADMIN" && (
          <>
            <p className="text-gray-500 text-xs uppercase px-3 pt-4 pb-1 font-semibold tracking-wider">
              Admin
            </p>
            {adminItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  path.startsWith(href)
                    ? "bg-yellow-400 text-gray-900 font-semibold"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 w-full transition"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  );
}
