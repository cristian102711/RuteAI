"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Llama al BFF /api/rutas, que optimiza los pedidos activos con ai-service
// y (si hay repartidor asignado) persiste la ruta en core.
export function OptimizarRutasButton() {
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  async function optimizar() {
    setCargando(true);
    try {
      const res = await fetch("/api/rutas", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "No se pudo optimizar la ruta");
        return;
      }

      const stops = json.data?.rutaOptimizada?.length ?? 0;
      const r = json.data?.resumen;
      const enRiesgo = r?.paradasEnRiesgo ?? 0;
      const detalle = r ? ` · ~${r.duracionTotalMin} min` : "";
      const riesgo = enRiesgo > 0 ? ` · ⚠ ${enRiesgo} en riesgo SLA` : "";
      if (json.data?.persistida) {
        toast.success(`Ruta optimizada y guardada · ${stops} paradas${detalle}${riesgo}`);
        router.refresh();
      } else {
        toast.success(`Ruta optimizada · ${stops} paradas${detalle}${riesgo} (sin repartidor)`);
      }
    } catch {
      toast.error("Error al conectar con el servicio de rutas");
    } finally {
      setCargando(false);
    }
  }

  return (
    <button
      onClick={optimizar}
      disabled={cargando}
      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-400 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:opacity-90 transition-opacity disabled:opacity-60"
    >
      {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {cargando ? "Optimizando…" : "Optimizar Rutas con IA"}
    </button>
  );
}
