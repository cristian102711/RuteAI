import { Plus, Search, Filter, Download, MoreHorizontal } from "lucide-react";

export default function SuperAdminEmpresas() {
  const empresas = [
    {
      id: "t_01",
      nombre: "Mercado Andino",
      inicial: "M",
      plan: "Business",
      estado: "Activa",
      usuarios: 42,
      entregas: "18.420",
      pais: "Colombia",
      actividad: "hace 4 min"
    },
    {
      id: "t_02",
      nombre: "Farmacias del Pacífico",
      inicial: "F",
      plan: "Pro",
      estado: "Activa",
      usuarios: 18,
      entregas: "6.210",
      pais: "Chile",
      actividad: "hace 12 min"
    },
    {
      id: "t_03",
      nombre: "Sushi Express MX",
      inicial: "S",
      plan: "Pro",
      estado: "Activa",
      usuarios: 24,
      entregas: "9.085",
      pais: "México",
      actividad: "hace 1 h"
    },
    {
      id: "t_04",
      nombre: "Floristería Camelia",
      inicial: "F",
      plan: "Starter",
      estado: "Activa",
      usuarios: 4,
      entregas: "540",
      pais: "Perú",
      actividad: "hace 3 h"
    },
    {
      id: "t_05",
      nombre: "Repuestos Martínez",
      inicial: "R",
      plan: "Starter",
      estado: "Inactiva",
      usuarios: 6,
      entregas: "0",
      pais: "Argentina",
      actividad: "hace 14 días"
    },
    {
      id: "t_06",
      nombre: "Cervecería Tropical",
      inicial: "C",
      plan: "Business",
      estado: "Activa",
      usuarios: 31,
      entregas: "12.780",
      pais: "Panamá",
      actividad: "hace 8 min"
    },
    {
      id: "t_07",
      nombre: "Petfood Andes",
      inicial: "P",
      plan: "Pro",
      estado: "Activa",
      usuarios: 11,
      entregas: "3.120",
      pais: "Ecuador",
      actividad: "hace 2 días"
    }
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-purple-500">Tenants</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Empresas</h1>
          <p className="mt-1 text-sm text-zinc-400">Gestiona los 7 tenants de RouteAI.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:opacity-90">
          <Plus className="h-4 w-4" /> Nueva empresa
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-white/[0.02]">
        
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-zinc-800 p-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input 
              placeholder="Buscar empresa…" 
              className="h-9 w-full rounded-md border border-zinc-800 bg-white/[0.03] pl-9 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          
          <button className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10">
            <Filter className="h-3.5 w-3.5" /> Plan
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10">
            <Filter className="h-3.5 w-3.5" /> Estado
          </button>
          
          <div className="ml-auto"></div>
          
          <button className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10">
            <Download className="h-3.5 w-3.5" /> Exportar
          </button>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr className="border-b border-zinc-800">
              <th className="px-5 py-3 font-medium">Empresa</th>
              <th className="px-5 py-3 font-medium">Plan</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Usuarios</th>
              <th className="px-5 py-3 font-medium">Entregas / mes</th>
              <th className="px-5 py-3 font-medium">País</th>
              <th className="px-5 py-3 font-medium">Última actividad</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {empresas.map((empresa) => (
              <tr key={empresa.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-amber-500/20 to-purple-500/20 text-xs font-bold text-amber-500 ring-1 ring-inset ring-white/10">
                      {empresa.inicial}
                    </div>
                    <div>
                      <div className="font-medium text-white">{empresa.nombre}</div>
                      <div className="text-xs text-zinc-500 font-mono">{empresa.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  {empresa.plan === "Business" && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-amber-500/20 to-purple-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/30">
                      ★ Business
                    </span>
                  )}
                  {empresa.plan === "Pro" && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/15 px-2 py-0.5 text-xs font-semibold text-purple-400 ring-1 ring-inset ring-purple-500/30">
                      Pro
                    </span>
                  )}
                  {empresa.plan === "Starter" && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-white/10">
                      Starter
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {empresa.estado === "Activa" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>Activa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>Inactiva
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 tabular-nums text-zinc-300">{empresa.usuarios}</td>
                <td className="px-5 py-3 tabular-nums text-zinc-300">{empresa.entregas}</td>
                <td className="px-5 py-3 text-zinc-400">{empresa.pais}</td>
                <td className="px-5 py-3 text-zinc-400">{empresa.actividad}</td>
                <td className="px-5 py-3 text-right">
                  <button className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 hover:bg-white/10 hover:text-white transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Pagination */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3 text-xs text-zinc-500">
          <div>Mostrando 7 de 7</div>
          <div className="flex gap-2">
            <button className="rounded border border-zinc-800 px-2 py-1 hover:bg-white/5 hover:text-zinc-300">Anterior</button>
            <button className="rounded border border-zinc-800 px-2 py-1 hover:bg-white/5 hover:text-zinc-300">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
