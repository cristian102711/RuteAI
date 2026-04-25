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
    <aside className="w-72 bg-card-bg/95 backdrop-blur-2xl border-r border-border-ui flex-col hidden md:flex z-50 transition-colors duration-500">
      {/* Logo */}
      <div className="p-8 border-b border-border-ui flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground via-zinc-500 to-foreground">
          Route<span className="text-emerald-500 bg-none">AI</span>
        </h2>
        <span className="text-[10px] text-emerald-500 font-mono tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">PRO</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-3.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-3 group ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]"
                  : "text-zinc-500 hover:bg-emerald-500/10 hover:text-foreground border border-transparent hover:border-emerald-500/20"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110 text-emerald-500" : "group-hover:scale-110 group-hover:text-emerald-500"}`} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-border-ui bg-background/30 flex flex-col gap-3 transition-colors duration-500">
        <div className="px-4 py-3 rounded-xl bg-background/50 border border-border-ui shadow-inner">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-0.5">Sesión Activa</p>
          <p className="text-xs text-foreground font-mono truncate">{userEmail}</p>
        </div>

        <Link 
          href="/dashboard/configuracion"
          className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex justify-center items-center gap-2 group active:scale-95 ${
            isConfigActive
              ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
              : "bg-background/50 text-zinc-400 hover:bg-background hover:text-foreground border border-border-ui"
          }`}
        >
          <Settings className={`w-4 h-4 transition-transform duration-500 ${isConfigActive ? "rotate-90" : "group-hover:rotate-90"}`} /> Configuración
        </Link>

        <LogoutButton />
      </div>
    </aside>
  );
}
