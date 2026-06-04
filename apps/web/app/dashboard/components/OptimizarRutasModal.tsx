"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Zap, AlertTriangle, CheckCircle, Clock, MapPin, Loader2 } from "lucide-react";

interface PedidoOptimizado {
  id: string;
  nombreCliente: string;
  direccion: string;
  estado: string;
  horarioPreferido: string | null;
  score: number;
  nivel: string;
  diasRetraso: number;
}

interface ResultadoOptimizacion {
  success: boolean;
  totalPedidos: number;
  ahorroEstimadoMin: number;
  rutaOptimizada: PedidoOptimizado[];
  mensaje?: string;
}

const nivelConfig = {
  alto: { color: "text-rose-400", bg: "bg-rose-500/10", ring: "ring-rose-500/20", label: "Alto riesgo" },
  medio: { color: "text-amber-400", bg: "bg-amber-500/10", ring: "ring-amber-500/20", label: "Riesgo medio" },
  bajo: { color: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20", label: "Riesgo bajo" },
};

export default function OptimizarRutasModal() {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoOptimizacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paso, setPaso] = useState<"idle" | "analizando" | "calculando" | "listo">("idle");
  const [aplicando, setAplicando] = useState(false);
  const [aplicado, setAplicado] = useState(false);

  const optimizar = useCallback(async () => {
    setCargando(true);
    setResultado(null);
    setError(null);
    setPaso("analizando");

    // Animación de pasos
    await new Promise((r) => setTimeout(r, 900));
    setPaso("calculando");

    try {
      const res = await fetch("/api/rutas/optimizar", { method: "POST" });
      const data = await res.json();

      await new Promise((r) => setTimeout(r, 700));
      setPaso("listo");

      if (data.success) {
        setResultado(data);
      } else {
        setError(data.error ?? "Error desconocido");
      }
    } catch {
      setError("No se pudo conectar al servicio de IA.");
      setPaso("idle");
    } finally {
      setCargando(false);
    }
  }, []);

  const abrir = () => {
    setAbierto(true);
    setResultado(null);
    setError(null);
    setPaso("idle");
    setAplicado(false);
    optimizar();
  };

  const cerrar = () => {
    setAbierto(false);
    setPaso("idle");
    setAplicado(false);
  };

  const handleAplicar = async () => {
    if (!resultado) return;
    try {
      setAplicando(true);
      const res = await fetch("/api/rutas/aplicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rutaOptimizada: resultado.rutaOptimizada.map((p) => ({
            id: p.id,
            score: p.score,
            nivel: p.nivel,
          })),
          ahorroEstimadoMin: resultado.ahorroEstimadoMin,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAplicado(true);
        // Cerrar automáticamente después de 2 segundos
        setTimeout(() => cerrar(), 2000);
      } else {
        setError(data.error ?? "Error al aplicar la ruta");
      }
    } catch {
      setError("Error de conexión al guardar la ruta.");
    } finally {
      setAplicando(false);
    }
  };

  return (
    <>
      {/* Botón disparador — reutilizable desde cualquier página */}
      <button
        onClick={abrir}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-400 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:opacity-90 active:scale-[0.98] transition-all"
      >
        <Sparkles className="h-4 w-4" /> Optimizar Rutas con IA
      </button>

      {/* Overlay + Modal */}
      <AnimatePresence>
        {abierto && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={cerrar}
            />

            {/* Modal panel */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="fixed inset-x-4 top-[8%] z-50 mx-auto max-w-xl overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900 shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Barra gradiente superior */}
              <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-purple-400 to-amber-500" />

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/15 ring-1 ring-purple-500/30">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Optimizador de Rutas IA</div>
                    <div className="text-xs text-zinc-500">Modelo gpt-logistics-v2.1</div>
                  </div>
                </div>
                <button
                  onClick={cerrar}
                  className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-white/[0.05] hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Contenido */}
              <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

                {/* Estado: Cargando */}
                <AnimatePresence mode="wait">
                  {cargando && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      {/* Pasos de progreso animados */}
                      {[
                        { id: "analizando", label: "Analizando pedidos pendientes…", done: paso === "calculando" || paso === "listo" },
                        { id: "calculando", label: "Calculando riesgo con IA por parada…", done: paso === "listo" },
                        { id: "listo", label: "Generando ruta optimizada…", done: false },
                      ].map((step, i) => {
                        const activo =
                          (paso === "analizando" && i === 0) ||
                          (paso === "calculando" && i === 1) ||
                          (paso === "listo" && i === 2);
                        return (
                          <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.15 }}
                            className="flex items-center gap-3"
                          >
                            <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                              step.done
                                ? "border-emerald-500/50 bg-emerald-500/10"
                                : activo
                                ? "border-purple-500/50 bg-purple-500/10"
                                : "border-white/[0.07] bg-white/[0.02]"
                            }`}>
                              {step.done ? (
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                              ) : activo ? (
                                <Loader2 className="h-3.5 w-3.5 text-purple-400 animate-spin" />
                              ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                              )}
                            </div>
                            <span className={`text-sm ${step.done ? "text-zinc-400 line-through" : activo ? "text-white" : "text-zinc-600"}`}>
                              {step.label}
                            </span>
                          </motion.div>
                        );
                      })}

                      {/* Barra de progreso animada */}
                      <div className="h-1 w-full rounded-full bg-white/[0.05] overflow-hidden mt-2">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-purple-600 to-amber-500"
                          initial={{ width: "5%" }}
                          animate={{
                            width: paso === "analizando" ? "40%" : paso === "calculando" ? "75%" : "100%",
                          }}
                          transition={{ duration: 0.6, ease: "easeInOut" }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Estado: Error */}
                  {!cargando && error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4"
                    >
                      <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-rose-400">Error al optimizar</div>
                        <p className="text-xs text-zinc-400 mt-1">{error}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Estado: Resultado */}
                  {!cargando && resultado && (
                    <motion.div
                      key="resultado"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      className="space-y-4"
                    >
                      {resultado.totalPedidos === 0 ? (
                        <div className="flex flex-col items-center py-8 text-center">
                          <CheckCircle className="h-10 w-10 text-emerald-400 mb-3" />
                          <div className="text-sm font-semibold text-white">¡Sin pedidos pendientes!</div>
                          <p className="text-xs text-zinc-500 mt-1">No hay rutas que optimizar en este momento.</p>
                        </div>
                      ) : (
                        <>
                          {/* Banner de resultado */}
                          <div className="flex items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                            <Zap className="h-5 w-5 text-purple-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-white">
                                {resultado.totalPedidos} parada{resultado.totalPedidos !== 1 ? "s" : ""} reordenada{resultado.totalPedidos !== 1 ? "s" : ""}
                              </div>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                Ahorro estimado: <span className="text-amber-400 font-semibold">~{resultado.ahorroEstimadoMin} min</span> en tiempo total de ruta
                              </p>
                            </div>
                          </div>

                          {/* Lista de paradas reordenadas */}
                          <div className="space-y-2">
                            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                              Orden óptimo de entrega
                            </div>
                            {resultado.rutaOptimizada.map((pedido, idx) => {
                              const config = nivelConfig[pedido.nivel as keyof typeof nivelConfig] ?? nivelConfig.medio;
                              return (
                                <motion.div
                                  key={pedido.id}
                                  initial={{ opacity: 0, x: -12 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.07 }}
                                  className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition-colors"
                                >
                                  {/* Número */}
                                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-purple-500/15 text-xs font-bold text-purple-400 ring-1 ring-purple-500/20">
                                    {idx + 1}
                                  </div>

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-zinc-100 truncate">{pedido.nombreCliente}</span>
                                      <span className={`shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${config.bg} ${config.color} ${config.ring}`}>
                                        {config.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <MapPin className="h-3 w-3 text-zinc-600 shrink-0" />
                                      <span className="text-xs text-zinc-500 truncate">{pedido.direccion}</span>
                                    </div>
                                  </div>

                                  {/* Score + horario */}
                                  <div className="shrink-0 text-right">
                                    <div className="text-xs font-mono font-semibold text-zinc-300">{Math.round(pedido.score)}</div>
                                    {pedido.horarioPreferido && (
                                      <div className="flex items-center gap-1 text-[10px] text-zinc-600 mt-0.5 justify-end">
                                        <Clock className="h-2.5 w-2.5" />
                                        {pedido.horarioPreferido}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              {!cargando && resultado && resultado.totalPedidos > 0 && (
                <div className="border-t border-white/[0.05] px-6 py-4 flex items-center justify-between gap-3">
                  {aplicado ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex w-full items-center justify-center gap-2 text-emerald-400"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-semibold">¡Ruta guardada! Cerrando...</span>
                    </motion.div>
                  ) : (
                    <>
                      <p className="text-xs text-zinc-500">El orden fue calculado priorizando mayor riesgo de fallo primero.</p>
                      <button
                        onClick={handleAplicar}
                        disabled={aplicando}
                        className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-400 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all"
                      >
                        {aplicando ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...</>
                        ) : (
                          <>Aplicar ruta</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
