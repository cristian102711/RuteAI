"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Package, Users, Map, 
  ChartColumn, Sparkles, Settings, ChevronDown, Route
} from "lucide-react";
import { LogoutButton } from "./LogoutButton";

interface SidebarProps {
  empresaNombre: string;
  usuarioNombre: string;
  usuarioEmail: string;
}

export function Sidebar({ empresaNombre, usuarioNombre, usuarioEmail }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-805 bg-[oklch(0.17_0.005_285)] md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-zinc-850 px-5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 relative grid place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-purple-600 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Route className="h-1/2 w-1/2 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            Route<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">AI</span>
          </span>
        </div>
      </div>

      {/* Selector de Empresa */}
      <div className="border-b border-zinc-800 px-3 py-3">
        <button className="flex w-full items-center justify-between rounded-lg bg-white/5 px-2.5 py-2 text-left ring-1 ring-inset ring-white/5 hover:bg-white/10 transition">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-amber-500/30 to-purple-500/30 text-xs font-bold text-white">
              {empresaNombre.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white">{empresaNombre}</div>
              <div className="truncate text-[11px] text-zinc-400">Plan Pro · Global</div>
            </div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        <Link 
          href="/dashboard" 
          className={`group flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors ${pathname === '/dashboard' ? 'bg-white/[0.06] text-white ring-1 ring-inset ring-white/10' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}
        >
          <span className="flex items-center gap-2.5">
            <LayoutDashboard className={`h-4 w-4 ${pathname === '/dashboard' ? 'text-amber-500' : ''}`} />
            Dashboard
          </span>
        </Link>

        <Link 
          href="/dashboard/pedidos" 
          className={`group flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors ${isActive('/dashboard/pedidos') ? 'bg-white/[0.06] text-white ring-1 ring-inset ring-white/10' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}
        >
          <span className="flex items-center gap-2.5">
            <Package className={`h-4 w-4 ${isActive('/dashboard/pedidos') ? 'text-amber-500' : ''}`} />
            Pedidos
          </span>
          <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-purple-400">24</span>
        </Link>

        <Link 
          href="/dashboard/equipo" 
          className={`group flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors ${isActive('/dashboard/equipo') ? 'bg-white/[0.06] text-white ring-1 ring-inset ring-white/10' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}
        >
          <span className="flex items-center gap-2.5">
            <Users className={`h-4 w-4 ${isActive('/dashboard/equipo') ? 'text-amber-500' : ''}`} />
            Equipo
          </span>
        </Link>

        <Link 
          href="/dashboard/rutas" 
          className={`group flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors ${isActive('/dashboard/rutas') ? 'bg-white/[0.06] text-white ring-1 ring-inset ring-white/10' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}
        >
          <span className="flex items-center gap-2.5">
            <Map className={`h-4 w-4 ${isActive('/dashboard/rutas') ? 'text-amber-500' : ''}`} />
            Rutas
          </span>
        </Link>

        <Link 
          href="/dashboard/reportes" 
          className={`group flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors ${isActive('/dashboard/reportes') ? 'bg-white/[0.06] text-white ring-1 ring-inset ring-white/10' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}
        >
          <span className="flex items-center gap-2.5">
            <ChartColumn className={`h-4 w-4 ${isActive('/dashboard/reportes') ? 'text-amber-500' : ''}`} />
            Reportes
          </span>
        </Link>

        <Link 
          href="/dashboard/asistente" 
          className={`group flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors ${isActive('/dashboard/asistente') ? 'bg-white/[0.06] text-white ring-1 ring-inset ring-white/10' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}
        >
          <span className="flex items-center gap-2.5">
            <Sparkles className={`h-4 w-4 ${isActive('/dashboard/asistente') ? 'text-amber-500' : ''}`} />
            Asistente IA
          </span>
        </Link>
        <Link 
          href="/dashboard/configuracion" 
          className={`group flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors ${isActive('/dashboard/configuracion') ? 'bg-white/[0.06] text-white ring-1 ring-inset ring-white/10' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}
        >
          <span className="flex items-center gap-2.5">
            <Settings className={`h-4 w-4 ${isActive('/dashboard/configuracion') ? 'text-amber-500' : ''}`} />
            Configuración
          </span>
        </Link>
      </nav>

      {/* Perfil Usuario */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-white/5 transition group relative">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-amber-500 to-purple-600 text-xs font-bold text-white">
            {usuarioNombre.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{usuarioNombre}</div>
            <div className="truncate text-[11px] text-zinc-400">{usuarioEmail}</div>
          </div>
          <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <LogoutButton compact />
          </div>
        </div>
      </div>
    </aside>
  );
}
