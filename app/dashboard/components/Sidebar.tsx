"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Package, Map as MapIcon, Brain, Settings, Bell, BarChart3 } from "lucide-react";
import { LogoutButton } from "./LogoutButton";

export function Sidebar({ userEmail }: { userEmail: string | undefined }) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Panel Central", icon: MapPin },
    { href: "/dashboard/pedidos", label: "Todos los Pedidos", icon: Package },
    { href: "/dashboard/rutas", label: "Rutas Inteligentes", icon: MapIcon },
    { href: "/dashboard/ia", label: "Predicciones IA", icon: Brain },
    { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3 },
    { href: "/dashboard/alertas", label: "Alertas", icon: Bell },
  ];

  const isConfigActive = pathname === "/dashboard/configuracion";

  return (
    <aside className="w-72 bg-zinc-950/80 backdrop-blur-2xl border-r border-zinc-800/60 flex-col hidden md:flex z-50 shadow-2xl">
      {/* Logo */}
      <div className="p-8 border-b border-zinc-800/60 flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
          Route<span className="text-emerald-400 bg-none">AI</span>
        </h2>
        <span className="text-[10px] text-emerald-400 font-mono tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.1)]">PRO</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          // Validar si estamos exactamente en esa ruta para colorearlo bien
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-3.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-3 group ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.15)]"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100 border border-transparent hover:border-zinc-700/50 hover:-translate-y-0.5"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110 text-emerald-300" : "group-hover:scale-110 group-hover:text-emerald-400"}`} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-zinc-800/60 bg-zinc-950/50 flex flex-col gap-3">
        <div className="px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 shadow-inner">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-0.5">Sesión Activa</p>
          <p className="text-xs text-zinc-300 font-mono truncate">{userEmail}</p>
        </div>

        <Link 
          href="/dashboard/configuracion"
          className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex justify-center items-center gap-2 group active:scale-95 ${
            isConfigActive
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-700/50 hover:border-zinc-600"
          }`}
        >
          <Settings className={`w-4 h-4 transition-transform duration-500 ${isConfigActive ? "rotate-90" : "group-hover:rotate-90"}`} /> Configuración
        </Link>

        <LogoutButton />
      </div>
    </aside>
  );
}
