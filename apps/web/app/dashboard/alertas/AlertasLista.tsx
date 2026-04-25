"use client";

import { AlertTriangle, CheckCheck } from "lucide-react";
import { useAlertasRealtime } from "@/hooks/useAlertasRealtime";
import type { Alerta } from "@prisma/client";

type AlertaConRepartidor = Alerta & {
  repartidor: { id: string; nombre: string } | null;
};

type TipoConfig = Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icono: React.ComponentType<{ className?: string }>;
  }
>;

interface AlertasListaProps {
  alertasIniciales: AlertaConRepartidor[];
  empresaId: string;
  tipoConfig: TipoConfig;
}

export function AlertasLista({ alertasIniciales, empresaId, tipoConfig }: AlertasListaProps) {
  const { alertas, marcarLeida, marcarTodasLeidas } = useAlertasRealtime(
    empresaId,
    alertasIniciales
  );

  const noLeidas = alertas.filter((a) => !a.leida).length;

  return (
    <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Historial ({alertas.length})
        </h2>
        {noLeidas > 0 && (
          <button
            onClick={marcarTodasLeidas}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {alertas.length === 0 ? (
        <div className="text-center py-20">
          <CheckCheck className="w-12 h-12 text-emerald-400 mx-auto mb-4 opacity-50" />
          <p className="text-zinc-400 font-medium">No hay alertas registradas</p>
          <p className="text-zinc-600 text-sm mt-1">El sistema monitoreará tu flota automáticamente</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alertas.map((alerta) => {
            const cfg = tipoConfig[alerta.tipo] ?? tipoConfig["desvio"];
            const Icono = cfg.icono;
            const fecha = new Date(alerta.createdAt);

            return (
              <div
                key={alerta.id}
                className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                  alerta.leida
                    ? "bg-zinc-900/20 border-zinc-800/40 opacity-60"
                    : `${cfg.bg} ${cfg.border} border shadow-sm`
                }`}
              >
                {/* Indicador de no leída */}
                {!alerta.leida && (
                  <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
                    alerta.tipo === "riesgo_alto"
                      ? "bg-rose-500 animate-pulse"
                      : alerta.tipo === "retraso"
                      ? "bg-blue-500"
                      : "bg-amber-500"
                  }`} />
                )}

                <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                  <Icono className={`w-4 h-4 ${cfg.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${cfg.color}`}>
                        {cfg.label}
                      </p>
                      <p className="text-zinc-200 text-sm font-medium leading-snug">
                        {alerta.mensaje}
                      </p>
                      {alerta.repartidor && (
                        <p className="text-zinc-500 text-xs mt-1">
                          🚚 {alerta.repartidor.nombre}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <p className="text-zinc-600 text-[10px] font-mono whitespace-nowrap">
                        {fecha.toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}
                        {" "}{fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {!alerta.leida && (
                        <button
                          onClick={() => marcarLeida(alerta.id)}
                          className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
                        >
                          Marcar leída
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
