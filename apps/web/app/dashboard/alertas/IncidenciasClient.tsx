"use client";

import { useState, useMemo } from "react";
import {
  TriangleAlert, Clock, RefreshCw, TrendingDown,
  Search, Funnel, Phone, MessageSquare, RotateCcw,
  CheckCircle, XCircle, Sparkles, CheckCheck, MapPin
} from "lucide-react";
import { toast } from "sonner";

type Alerta = {
  id: string;
  tipo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string | Date;
  repartidor: { id: string; nombre: string } | null;
};

interface Props {
  alertas: Alerta[];
  empresaId: string;
  totalPedidos: number;
}

const TIPO_LABELS: Record<string, { label: string; color: string; bg: string; ring: string; dot: string }> = {
  desvio: {
    label: "Desvío de ruta",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/30",
    dot: "bg-amber-400",
  },
  retraso: {
    label: "Retraso",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/30",
    dot: "bg-blue-400",
  },
  riesgo_alto: {
    label: "Riesgo alto IA",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    ring: "ring-rose-500/30",
    dot: "bg-rose-400",
  },
};

function tiempoRelativo(fecha: string | Date): string {
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return new Date(fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}

const MOTIVOS = ["Todos", "desvio", "retraso", "riesgo_alto"];
const MOTIVO_LABELS: Record<string, string> = {
  Todos: "Todas",
  desvio: "Desvío de ruta",
  retraso: "Retraso",
  riesgo_alto: "Riesgo alto IA",
};

export function IncidenciasClient({ alertas: alertasIniciales, totalPedidos }: Props) {
  const [alertas, setAlertas] = useState<Alerta[]>(alertasIniciales);
  const [query, setQuery] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroLeidas, setFiltroLeidas] = useState(false);

  // Métricas
  const noLeidas   = alertas.filter((a) => !a.leida).length;
  const enRuta     = alertas.filter((a) => !a.leida && a.tipo === "retraso").length;
  const tasaIncid  = totalPedidos > 0 ? ((alertas.length / totalPedidos) * 100).toFixed(1) : "0.0";

  // Filtrado
  const filtradas = useMemo(() => {
    return alertas.filter((a) => {
      const matchTipo  = filtroTipo === "Todos" || a.tipo === filtroTipo;
      const matchLeida = filtroLeidas ? !a.leida : true;
      const matchQuery = query === "" ||
        a.mensaje.toLowerCase().includes(query.toLowerCase()) ||
        (a.repartidor?.nombre ?? "").toLowerCase().includes(query.toLowerCase());
      return matchTipo && matchLeida && matchQuery;
    });
  }, [alertas, filtroTipo, filtroLeidas, query]);

  // Acciones
  async function marcarLeida(id: string) {
    try {
      await fetch("/api/alertas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setAlertas((prev) => prev.map((a) => (a.id === id ? { ...a, leida: true } : a)));
    } catch {
      toast.error("Error al marcar como leída");
    }
  }

  async function marcarTodasLeidas() {
    try {
      await fetch("/api/alertas", { method: "PATCH" });
      setAlertas((prev) => prev.map((a) => ({ ...a, leida: true })));
      toast.success("Todas las alertas marcadas como leídas");
    } catch {
      toast.error("Error al actualizar alertas");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-500 font-bold">Operación</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Centro de incidencias</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {noLeidas > 0
              ? `${noLeidas} alerta${noLeidas > 1 ? "s" : ""} sin resolver — requieren atención`
              : "Todo está bajo control · Sin alertas activas"}
          </p>
        </div>
        {noLeidas > 0 && (
          <button
            onClick={marcarTodasLeidas}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Resolver todas
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Abiertas */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Abiertas ahora</span>
            <span className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/10 text-rose-400">
              <TriangleAlert className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-white">{noLeidas}</div>
          <div className="mt-1 text-[11px] text-zinc-500">requieren acción</div>
        </div>
        {/* Retrasos */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Retrasos activos</span>
            <span className="grid h-7 w-7 place-items-center rounded-md bg-amber-500/10 text-amber-400">
              <Clock className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-white">{enRuta}</div>
          <div className="mt-1 text-[11px] text-zinc-500">sin resolver</div>
        </div>
        {/* En resolución */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Resueltas hoy</span>
            <span className="grid h-7 w-7 place-items-center rounded-md bg-blue-500/10 text-blue-400">
              <RefreshCw className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-white">
            {alertas.filter((a) => a.leida).length}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">marcadas como leídas</div>
        </div>
        {/* Tasa */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Tasa de incidencias</span>
            <span className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500/10 text-emerald-400">
              <TrendingDown className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-white">{tasaIncid}%</div>
          <div className="mt-1 text-[11px] text-zinc-500">alertas / total pedidos</div>
        </div>
      </div>

      {/* Banner IA (si hay alertas no leídas) */}
      {noLeidas > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-transparent p-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-purple-500/20 text-purple-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">Sugerencia IA</div>
            <p className="mt-0.5 text-xs text-zinc-400">
              {alertas.filter((a) => a.tipo === "desvio" && !a.leida).length > 0
                ? `Se detectaron ${alertas.filter((a) => a.tipo === "desvio" && !a.leida).length} desvíos de ruta activos. Verifica que los repartidores estén en la ruta asignada.`
                : alertas.filter((a) => a.tipo === "riesgo_alto" && !a.leida).length > 0
                ? `${alertas.filter((a) => a.tipo === "riesgo_alto" && !a.leida).length} pedido(s) con riesgo alto de fallo. Contacta al cliente para confirmar disponibilidad.`
                : "Hay retrasos activos en tu flota. Considera notificar a los clientes afectados."}
            </p>
          </div>
        </div>
      )}

      {/* Tabla de incidencias */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] overflow-hidden">
        {/* Controles */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.04] p-3 bg-zinc-950/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              placeholder="Buscar por mensaje o repartidor…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-white/[0.04] bg-white/5 pl-9 text-sm placeholder:text-zinc-500 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-shadow"
            />
          </div>

          {/* Filtros por tipo */}
          <div className="flex flex-wrap items-center gap-1 rounded-md border border-white/[0.04] bg-white/5 p-0.5 text-xs">
            {MOTIVOS.map((m) => (
              <button
                key={m}
                onClick={() => setFiltroTipo(m)}
                className={`rounded px-2.5 py-1 transition-colors ${
                  filtroTipo === m ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {MOTIVO_LABELS[m]}
              </button>
            ))}
          </div>

          {/* Filtro pendientes */}
          <button
            onClick={() => setFiltroLeidas(!filtroLeidas)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
              filtroLeidas
                ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                : "border-white/[0.04] bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            <Funnel className="h-3.5 w-3.5" />
            Sin resolver
          </button>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-zinc-500 bg-zinc-950/20">
              <tr className="border-b border-white/[0.04]">
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Descripción</th>
                <th className="px-5 py-3 font-medium">Repartidor</th>
                <th className="px-5 py-3 font-medium">Reportada</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3 opacity-50" />
                    <p className="text-zinc-400 font-medium">No hay incidencias</p>
                    <p className="text-zinc-600 text-xs mt-1">
                      {filtroLeidas || filtroTipo !== "Todos" || query
                        ? "Prueba cambiando los filtros"
                        : "El sistema monitoreará tu flota automáticamente"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtradas.map((alerta) => {
                  const cfg = TIPO_LABELS[alerta.tipo] ?? TIPO_LABELS.desvio;
                  return (
                    <tr
                      key={alerta.id}
                      className={`group transition-colors hover:bg-white/[0.02] ${alerta.leida ? "opacity-50" : ""}`}
                    >
                      {/* Tipo */}
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.bg} ${cfg.color} ${cfg.ring}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${!alerta.leida ? "animate-pulse" : ""}`} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Descripción */}
                      <td className="px-5 py-3 max-w-xs">
                        <p className="text-white text-sm leading-snug line-clamp-2">{alerta.mensaje}</p>
                      </td>

                      {/* Repartidor */}
                      <td className="px-5 py-3">
                        {alerta.repartidor ? (
                          <span className="inline-flex items-center gap-1 text-zinc-400 text-xs">
                            <MapPin className="h-3 w-3" />
                            {alerta.repartidor.nombre}
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Tiempo */}
                      <td className="px-5 py-3 text-xs text-zinc-500 whitespace-nowrap">
                        {tiempoRelativo(alerta.createdAt)}
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-3">
                        {alerta.leida ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Resuelta
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                            Abierta
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {alerta.repartidor && (
                            <button
                              title="Contactar repartidor"
                              className="grid h-7 w-7 place-items-center rounded-md border border-white/[0.04] bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            title="Ver mensaje"
                            className="grid h-7 w-7 place-items-center rounded-md border border-white/[0.04] bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                          {!alerta.leida && (
                            <button
                              title="Marcar como resuelta"
                              onClick={() => marcarLeida(alerta.id)}
                              className="grid h-7 w-7 place-items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtradas.length > 0 && (
          <div className="flex items-center justify-between border-t border-white/[0.04] px-5 py-3 bg-zinc-950/20">
            <span className="text-xs text-zinc-500">{filtradas.length} incidencia{filtradas.length !== 1 ? "s" : ""} · {noLeidas} sin resolver</span>
            {noLeidas > 0 && (
              <button
                onClick={marcarTodasLeidas}
                className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Marcar todas como resueltas
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
