"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  "/admin":              "Empresas",
  "/admin/usuarios":     "Todos los Usuarios",
  "/admin/reportes":     "Reportes Globales",
  "/admin/configuracion":"Configuración",
};

export function AdminTopbar() {
  const pathname = usePathname();
  const label = ROUTE_LABELS[pathname] ?? "Panel";

  return (
    <div className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-8 py-3 flex items-center justify-between">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-medium">
        <Link href="/admin" className="text-zinc-500 hover:text-white transition-colors">
          RouteAI Admin
        </Link>
        {pathname !== "/admin" && (
          <>
            <ChevronRight className="w-3 h-3 text-zinc-700" />
            <span className="text-zinc-300">{label}</span>
          </>
        )}
      </nav>

      {/* Indicador de entorno */}
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sistema operativo</span>
      </div>
    </div>
  );
}
