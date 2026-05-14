"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, BarChart3, Settings, Shield, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { href: "/admin", label: "Empresas", icon: Building2, exact: true },
    { href: "/admin/usuarios", label: "Todos los Usuarios", icon: Users, exact: false },
    { href: "/admin/reportes", label: "Reportes Globales", icon: BarChart3, exact: false },
    { href: "/admin/configuracion", label: "Configuración", icon: Settings, exact: false },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="w-72 bg-zinc-900/80 border-r border-zinc-800 flex flex-col z-50 shadow-2xl">
      {/* Logo */}
      <div className="p-8 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-black tracking-tight text-white">
            Route<span className="text-violet-400">AI</span>
          </h2>
          <span className="text-[10px] text-violet-400 font-bold tracking-widest uppercase">Super Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 group ${
                isActive
                  ? "bg-violet-600/15 text-violet-300 font-semibold border border-violet-500/25 shadow-sm"
                  : "text-zinc-400 font-medium hover:bg-zinc-800 hover:text-white border border-transparent"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "text-violet-400" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-zinc-800 flex flex-col gap-3">
        <div className="px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Sesión</p>
          <p className="text-xs text-white font-medium truncate">{userEmail}</p>
          <p className="text-[10px] text-violet-400 font-bold tracking-widest uppercase mt-0.5">Super Admin</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 bg-zinc-800 text-zinc-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 border border-zinc-700"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
