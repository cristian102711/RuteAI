"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, AlertTriangle, MapPin, Clock, TrendingUp, CheckCheck, ExternalLink } from "lucide-react";
import Link from "next/link";

// ─── tipos ───────────────────────────────────────────────────────────────────
type AlertaItem = {
  id: string;
  tipo: string;
  mensaje: string;
  createdAt: string;
};

type Props = {
  initialCount: number;
  initialAlertas: AlertaItem[];
};

// ─── helpers ─────────────────────────────────────────────────────────────────
const TIPO_CONFIG: Record<string, { label: string; color: string; Icon: typeof Bell }> = {
  desvio:      { label: "Desvío",       color: "text-amber-400",  Icon: MapPin },
  retraso:     { label: "Retraso",      color: "text-blue-400",   Icon: Clock },
  riesgo_alto: { label: "Riesgo Alto",  color: "text-rose-400",   Icon: TrendingUp },
};

function tiempoRelativo(fechaISO: string): string {
  const diff = Date.now() - new Date(fechaISO).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} d`;
}

// ─── componente ──────────────────────────────────────────────────────────────
export function NotificationBell({ initialCount, initialAlertas }: Props) {
  const [count, setCount]       = useState(initialCount);
  const [alertas, setAlertas]   = useState<AlertaItem[]>(initialAlertas);
  const [open, setOpen]         = useState(false);
  const [marked, setMarked]     = useState(false);
  const dropdownRef             = useRef<HTMLDivElement>(null);

  // ── polling cada 30 s ──
  const fetchCount = useCallback(async () => {
    try {
      const res  = await fetch("/api/alertas/count", { cache: "no-store" });
      const data = await res.json();
      setCount(data.count ?? 0);
      setAlertas(data.alertas ?? []);
    } catch {
      // silencio — no interrumpir UX
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // ── cerrar al clickear afuera ──
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── abrir dropdown → marcar como leídas ──
  async function handleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen && count > 0 && !marked) {
      setMarked(true);
      setCount(0);
      try {
        await fetch("/api/alertas", { method: "PATCH" });
      } catch {
        // silencio
      }
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── botón campana ── */}
      <button
        onClick={handleOpen}
        aria-label="Notificaciones"
        className="relative grid h-9 w-9 place-items-center rounded-md border border-white/[0.04] bg-white/5 text-zinc-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40"
      >
        <Bell className="h-4 w-4" />

        {/* badge con número */}
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center">
            {/* ping animado */}
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-60" />
            <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white leading-none">
              {count > 9 ? "9+" : count}
            </span>
          </span>
        )}
      </button>

      {/* ── dropdown ── */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-950/95 shadow-2xl shadow-black/60 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {/* cabecera */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">Notificaciones</span>
            </div>
            {alertas.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                {alertas.length} nueva{alertas.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* lista */}
          <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.04]">
            {alertas.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-800/60">
                  <CheckCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-300">Todo al día</p>
                  <p className="text-xs text-zinc-600 mt-0.5">No hay alertas pendientes</p>
                </div>
              </div>
            ) : (
              alertas.map((alerta) => {
                const cfg  = TIPO_CONFIG[alerta.tipo] ?? { label: "Alerta", color: "text-zinc-400", Icon: AlertTriangle };
                const Icon = cfg.Icon;
                return (
                  <div key={alerta.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className={`mt-0.5 shrink-0 grid h-7 w-7 place-items-center rounded-lg bg-zinc-800/80`}>
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${cfg.color}`}>
                        {cfg.label}
                      </p>
                      <p className="text-xs text-zinc-300 leading-snug line-clamp-2">
                        {alerta.mensaje}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        {tiempoRelativo(alerta.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* pie */}
          <div className="border-t border-white/[0.06] px-4 py-2.5">
            <Link
              href="/dashboard/alertas"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              Ver todas las alertas
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
