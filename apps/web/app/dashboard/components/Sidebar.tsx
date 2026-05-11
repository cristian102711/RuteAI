"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { MapPin, Package, Map, Brain, Settings, Bell, BarChart3 } from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { LogoutButton } from "./LogoutButton";

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard", label: "Panel Central", icon: MapPin, activeColor: "text-primary", activeBg: "bg-primary/10", activeBorder: "border-primary/20" },
    { href: "/dashboard/pedidos", label: "Todos los Pedidos", icon: Package, activeColor: "text-amber-500", activeBg: "bg-amber-500/10", activeBorder: "border-amber-500/20" },
    { href: "/dashboard/rutas", label: "Rutas Inteligentes", icon: Map, activeColor: "text-blue-500", activeBg: "bg-blue-500/10", activeBorder: "border-blue-500/20" },
    { href: "/dashboard/ia", label: "Predicciones IA", icon: Brain, activeColor: "text-purple-500", activeBg: "bg-purple-500/10", activeBorder: "border-purple-500/20" },
    { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3, activeColor: "text-indigo-500", activeBg: "bg-indigo-500/10", activeBorder: "border-indigo-500/20" },
    { href: "/dashboard/alertas", label: "Alertas", icon: Bell, activeColor: "text-rose-500", activeBg: "bg-rose-500/10", activeBorder: "border-rose-500/20" },
  ];

  return (
    <aside className="w-72 bg-card border-r border-border-ui flex-col hidden md:flex z-50 shadow-xl transition-all duration-300">
      
      <div className="p-8 border-b border-border-ui flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-foreground">
          Route<span className="text-primary">AI</span>
        </h2>
        <span className="text-[10px] text-primary font-bold tracking-widest bg-primary/10 border border-primary/20 px-2 py-1 rounded-full uppercase">PRO</span>
      </div>

      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={`px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 group ${
                isActive 
                  ? `${item.activeBg} ${item.activeColor} font-semibold border ${item.activeBorder} shadow-sm` 
                  : "text-muted-foreground font-medium hover:bg-secondary hover:text-foreground border border-transparent"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? item.activeColor : "group-hover:text-foreground"}`} /> 
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-border-ui bg-secondary/30 flex flex-col gap-3">
        
        <div className="px-4 py-3 rounded-xl bg-card border border-border-ui shadow-sm mb-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Sesión</p>
          <p className="text-xs text-foreground font-medium truncate">{userEmail}</p>
        </div>

        {/* Selector de Modo Oscuro */}
        <ThemeToggle />

        <Link 
          href="/dashboard/configuracion"
          className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex justify-center items-center gap-2 group active:scale-95 ${
            pathname === "/dashboard/configuracion"
              ? "bg-foreground text-background shadow-md"
              : "bg-secondary text-foreground hover:bg-muted border border-border-ui"
          }`}
        >
          <Settings className={`w-4 h-4 transition-transform duration-500 ${pathname === "/dashboard/configuracion" ? "" : "group-hover:rotate-90"}`} /> 
          Configuración
        </Link>

        <LogoutButton />
      </div>
    </aside>
  );
}
