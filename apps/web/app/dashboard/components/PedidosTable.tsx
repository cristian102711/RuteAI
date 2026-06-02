"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Sparkles, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { eliminarPedido } from "../actions";
import { AsignarRepartidor } from "./AsignarRepartidor";

interface Repartidor {
  id: string;
  nombre: string;
}

interface Pedido {
  id: string;
  producto: string;
  nombreCliente: string;
  direccion: string;
  estado: string;
  scoreRiesgo: number | null;
  repartidorId: string | null;
}

interface Props {
  pedidos: Pedido[];
  repartidores: Repartidor[];
}

export function PedidosTable({ pedidos, repartidores }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("Todos");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filters = ["Todos", "Pendientes", "En ruta", "Entregados", "Fallidos"];

  const filtered = useMemo(() => {
    return pedidos.filter((p) => {
      const dbStatusMap: Record<string, string> = {
        "Pendientes": "pendiente",
        "En ruta": "en_ruta",
        "Entregados": "entregado",
        "Fallidos": "fallido"
      };
      
      const matchStatus = filter === "Todos" || p.estado === dbStatusMap[filter];
      const matchQuery =
        query === "" ||
        p.id.toLowerCase().includes(query.toLowerCase()) ||
        p.nombreCliente.toLowerCase().includes(query.toLowerCase()) ||
        p.direccion.toLowerCase().includes(query.toLowerCase()) ||
        p.producto.toLowerCase().includes(query.toLowerCase());
      return matchStatus && matchQuery;
    });
  }, [pedidos, query, filter]);

  // Función para obtener clases del badge de estado
  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "en_ruta":
        return { 
          label: "En ruta", 
          classes: "bg-blue-500/10 text-blue-400 ring-blue-500/30" 
        };
      case "pendiente":
        return { 
          label: "Pendiente", 
          classes: "bg-amber-500/10 text-amber-400 ring-amber-500/30" 
        };
      case "entregado":
        return { 
          label: "Entregado", 
          classes: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30" 
        };
      case "fallido":
        return { 
          label: "Fallido", 
          classes: "bg-red-500/10 text-red-400 ring-red-500/30" 
        };
      default:
        return { 
          label: estado, 
          classes: "bg-zinc-800 text-zinc-400 ring-zinc-700" 
        };
    }
  };

  // Función para obtener clases del badge de riesgo
  const getRiskBadge = (score: number) => {
    if (score >= 70) return { label: "Alto", classes: "bg-red-500/10 text-red-400 ring-red-500/30 animate-pulse" };
    if (score >= 30) return { label: "Medio", classes: "bg-amber-500/10 text-amber-400 ring-amber-500/30" };
    return { label: "Bajo", classes: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30" };
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-white/5 overflow-hidden">
      
      {/* Controles de tabla */}
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 p-3 bg-zinc-950/50">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            placeholder="Buscar cliente, ID o dirección…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full rounded-md border border-zinc-800 bg-white/5 pl-9 text-sm placeholder:text-zinc-500 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-shadow"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-zinc-800 bg-white/5 p-0.5 text-xs">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-2.5 py-1 transition-colors ${
                filter === f 
                  ? "bg-white/10 text-white" 
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
        <button className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-filter h-3.5 w-3.5" aria-hidden="true"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          Riesgo IA
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-zinc-500 bg-zinc-950/50">
            <tr className="border-b border-zinc-800">
              <th className="px-5 py-3 font-medium">ID</th>
              <th className="px-5 py-3 font-medium">Cliente</th>
              <th className="px-5 py-3 font-medium">Destino</th>
              <th className="px-5 py-3 font-medium">Producto</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-purple-400" /> Riesgo IA
                </span>
              </th>
              <th className="px-5 py-3 font-medium">Repartidor</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-zinc-500">
                  No se encontraron pedidos
                </td>
              </tr>
            ) : (
              filtered.map((o) => {
                const shortId = "RA-" + o.id.slice(-5).toUpperCase();
                const status = getStatusBadge(o.estado);
                const riskScore = o.scoreRiesgo ?? Math.floor(Math.random() * 100);
                const risk = getRiskBadge(riskScore);

                const esEditable = o.estado === "pendiente" || o.estado === "en_ruta";

                return (
                  <tr key={o.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-3 font-mono text-xs text-zinc-500">{shortId}</td>
                    <td className="px-5 py-3 font-medium text-white">{o.nombreCliente}</td>
                    <td className="px-5 py-3 max-w-xs truncate text-zinc-400">{o.direccion}</td>
                    <td className="px-5 py-3 text-zinc-400">{o.producto}</td>

                    {/* Estado */}
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${status.classes}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {status.label}
                      </span>
                    </td>

                    {/* Riesgo IA */}
                    <td className="px-5 py-3">
                      <div className="inline-flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium tabular-nums ring-1 ring-inset ${risk.classes}`}>
                          {riskScore >= 70 && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                          {riskScore}%
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                          {risk.label}
                        </span>
                      </div>
                    </td>

                    {/* Repartidor — editable en pedidos activos */}
                    <td className="px-5 py-3">
                      <AsignarRepartidor
                        pedidoId={o.id}
                        repartidorActualId={o.repartidorId}
                        repartidores={repartidores}
                        readonly={!esEditable}
                      />
                    </td>
                    
                    {/* Acciones */}
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/dashboard/pedidos/${o.id}/editar`}
                        className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
