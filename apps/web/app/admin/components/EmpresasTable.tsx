"use client";

import { useState, useMemo } from "react";
import { Building2, Users, Search } from "lucide-react";
import { EditarEmpresaModal } from "./EditarEmpresaModal";
import { ToggleEmpresaButton } from "./ToggleEmpresaButton";
import { EliminarEmpresaButton } from "./EliminarEmpresaButton";

const PLAN_BADGE: Record<string, string> = {
  starter:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  pro:      "bg-blue-500/10 text-blue-400 border-blue-500/30",
  business: "bg-violet-500/10 text-violet-400 border-violet-500/30",
};

interface Empresa {
  id: string;
  nombre: string;
  email: string;
  plan: string;
  activa: boolean;
  _count: { usuarios: number; pedidos: number };
}

export function EmpresasTable({ empresas }: { empresas: Empresa[] }) {
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("todos");

  const filtered = useMemo(() => {
    return empresas.filter((e) => {
      const matchQuery =
        query === "" ||
        e.nombre.toLowerCase().includes(query.toLowerCase()) ||
        e.email.toLowerCase().includes(query.toLowerCase());
      const matchPlan = planFilter === "todos" || e.plan === planFilter;
      return matchQuery && matchPlan;
    });
  }, [empresas, query, planFilter]);

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
      {/* Cabecera con buscador */}
      <div className="px-6 py-4 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2 shrink-0">
          <Building2 className="w-4 h-4 text-violet-400" />
          Tenants registrados
        </h2>

        <div className="flex items-center gap-2 flex-1 sm:justify-end">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar empresa..."
              className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all w-48"
            />
          </div>

          {/* Filtro por plan */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
          >
            <option value="todos">Todos los planes</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
          </select>

          <span className="text-xs text-zinc-500 font-mono shrink-0">
            {filtered.length} / {empresas.length}
          </span>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800/60 text-left">
            {["Empresa", "Plan", "Usuarios", "Pedidos", "Estado", "Acciones"].map((h) => (
              <th key={h} className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/40">
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-16 text-center text-zinc-600 text-sm">
                {query || planFilter !== "todos"
                  ? `Sin resultados para "${query || planFilter}"`
                  : "No hay empresas registradas."}
              </td>
            </tr>
          ) : (
            filtered.map((empresa) => (
              <tr key={empresa.id} className="hover:bg-zinc-800/20 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{empresa.nombre}</p>
                      <p className="text-[11px] text-zinc-500 font-mono">{empresa.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase ${PLAN_BADGE[empresa.plan] ?? PLAN_BADGE.starter}`}>
                    {empresa.plan}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-zinc-300 font-mono text-xs">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    {empresa._count.usuarios}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-zinc-300">
                  {empresa._count.pedidos}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${empresa.activa ? "text-emerald-400" : "text-zinc-500"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${empresa.activa ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
                    {empresa.activa ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <EditarEmpresaModal empresa={{ id: empresa.id, nombre: empresa.nombre, email: empresa.email, plan: empresa.plan }} />
                    <ToggleEmpresaButton id={empresa.id} activa={empresa.activa} nombre={empresa.nombre} />
                    <EliminarEmpresaButton id={empresa.id} nombre={empresa.nombre} />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
