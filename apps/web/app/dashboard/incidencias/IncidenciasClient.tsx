// apps/web/app/dashboard/incidencias/IncidenciasClient.tsx
"use client";

import { useState, useTransition } from "react";
import { 
  AlertTriangle, Clock, RefreshCw, TrendingDown, 
  Phone, Edit, RotateCcw, Package, MapPin, Sparkles, CheckCircle2,
  Search
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { reprogramarPedido } from "../actions";
import { PageWrapper, AnimatedHeader, AnimatedGrid, AnimatedCard, AnimatedSection } from "@/components/motion/PageWrapper";

interface Incidencia {
  id: string;
  nombreCliente: string;
  direccion: string;
  producto: string;
  clienteTelefono: string | null;
  motivoFallo: string | null;
  updatedAt: string;
  repartidorNombre: string;
}

interface Metrics {
  abiertasCount: number;
  slaVencidoCount: number;
  enResolucionCount: number;
  tasaIncidencias: number;
}

interface Props {
  incidencias: Incidencia[];
  metrics: Metrics;
}

export function IncidenciasClient({ incidencias, metrics }: Props) {
  const [isPending, startTransition] = useTransition();
  const [filterQuery, setFilterQuery] = useState("");

  const handleReprogramar = (id: string) => {
    const toastId = toast.loading("Reprogramando pedido...");
    startTransition(async () => {
      try {
        const res = await reprogramarPedido(id);
        if (res?.error) {
          toast.error(res.error, { id: toastId });
        } else {
          toast.success("Pedido reprogramado a pendiente", { id: toastId });
        }
      } catch (err) {
        toast.error("Error al reprogramar el pedido", { id: toastId });
      }
    });
  };

  const filtered = incidencias.filter(i => 
    i.nombreCliente.toLowerCase().includes(filterQuery.toLowerCase()) ||
    i.direccion.toLowerCase().includes(filterQuery.toLowerCase()) ||
    (i.motivoFallo && i.motivoFallo.toLowerCase().includes(filterQuery.toLowerCase())) ||
    i.id.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "hace un momento";
    if (diffMins < 60) return `hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `hace ${diffHours} h`;
    return new Date(dateStr).toLocaleDateString("es-CL");
  };

  // Encontrar el motivo de fallo más común para la sugerencia de la IA
  const motivos = incidencias.map(i => i.motivoFallo?.toLowerCase() || "");
  const esNadieEnDomicilio = motivos.filter(m => m.includes("nadie") || m.includes("ausente") || m.includes("responder") || m.includes("contesta")).length;
  const esDireccionIncorrecta = motivos.filter(m => m.includes("direcc") || m.includes("incorrecta") || m.includes("encontr")).length;

  let iaInsight: { titulo: string; descripcion: string; ahorro: string } | null = null;
  if (incidencias.length > 0) {
    if (esNadieEnDomicilio >= esDireccionIncorrecta && esNadieEnDomicilio > 0) {
      iaInsight = {
        titulo: "Patrón detectado por la IA: Ausencia de Clientes",
        descripcion: `Hemos detectado que ${esNadieEnDomicilio} de tus incidencias son por ausencia del destinatario ("Nadie en domicilio"). Te sugerimos reprogramar estas entregas en horario vespertino (18:00 - 20:00) o enviar una notificación preventiva por WhatsApp antes del despacho para ahorrar costos.`,
        ahorro: "$85.000 CLP estimado en costos de re-intento."
      };
    } else if (esDireccionIncorrecta > 0) {
      iaInsight = {
        titulo: "Patrón detectado por la IA: Problemas de Direccionamiento",
        descripcion: `Se detectaron problemas en las direcciones provistas para ${esDireccionIncorrecta} de los despachos fallidos. Te recomendamos habilitar la geocodificación estricta en el Onboarding de pedidos y verificar los datos en el mapa antes de asignar la ruta.`,
        ahorro: "Reducción de hasta un 15% en el tiempo promedio de ruta."
      };
    } else {
      iaInsight = {
        titulo: "Optimización de Incidencias con IA",
        descripcion: "Tus repartidores han reportado incidencias aisladas. Usa los botones rápidos para llamar a los destinatarios y resolver el direccionamiento o reprogramar los despachos en cola.",
        ahorro: "Resolución promedio de incidencias en menos de 15 minutos."
      };
    }
  }

  return (
    <PageWrapper className="px-2 pb-10">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <AnimatedHeader className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800 pb-8 pt-2">
          <div>
            <span className="text-purple-400 text-xs font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-purple-400" />
              Operaciones y Soporte
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              Centro de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">Incidencias</span>
            </h1>
            <p className="text-zinc-400 text-sm font-medium">
              Resuelve entregas fallidas y reclamos antes de que escalen en reclamos formales.
            </p>
          </div>
        </AnimatedHeader>

        {/* Metrics Grid */}
        <AnimatedGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedCard className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">Abiertas ahora</p>
              <p className="text-2xl font-black text-white">{metrics.abiertasCount}</p>
            </div>
          </AnimatedCard>

          <AnimatedCard className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">SLA Vencido</p>
              <p className="text-2xl font-black text-blue-400">{metrics.slaVencidoCount}</p>
            </div>
          </AnimatedCard>

          <AnimatedCard className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <RefreshCw className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">En resolución</p>
              <p className="text-2xl font-black text-purple-400">{metrics.enResolucionCount}</p>
            </div>
          </AnimatedCard>

          <AnimatedCard className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">Tasa Incidencias</p>
              <p className="text-2xl font-black text-emerald-400">{metrics.tasaIncidencias}%</p>
            </div>
          </AnimatedCard>
        </AnimatedGrid>

        {/* IA Insight Panel */}
        {iaInsight && (
          <AnimatedSection delay={0.1}>
            <div className="flex items-start gap-3 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent p-5 shadow-lg">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-500/20 text-purple-400">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-sm font-bold text-white">{iaInsight.titulo}</div>
                <p className="text-xs text-zinc-400 leading-relaxed">{iaInsight.descripcion}</p>
                <div className="text-[10px] font-semibold text-emerald-400 pt-1">💡 {iaInsight.ahorro}</div>
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Main Table Section */}
        <AnimatedSection delay={0.15}>
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] overflow-hidden">
            {/* Filter controls */}
            <div className="flex items-center gap-3 border-b border-white/[0.04] p-4 bg-zinc-950/20">
              <div className="relative flex-1 max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-zinc-500" />
                <input 
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Buscar por cliente, ID o dirección…" 
                  className="h-9 w-full rounded-xl border border-white/[0.04] bg-white/5 pl-9 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all outline-none"
                />
              </div>
              <span className="text-[10px] text-zinc-500 font-medium ml-auto">
                Mostrando {filtered.length} incidencia{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-zinc-500 bg-zinc-950/35">
                  <tr className="border-b border-white/[0.04]">
                    <th className="px-5 py-3.5 font-medium">ID Pedido</th>
                    <th className="px-5 py-3.5 font-medium">Cliente</th>
                    <th className="px-5 py-3.5 font-medium">Dirección</th>
                    <th className="px-5 py-3.5 font-medium">Motivo Fallo</th>
                    <th className="px-5 py-3.5 font-medium">Reportada</th>
                    <th className="px-5 py-3.5 font-medium">Repartidor</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <CheckCircle2 className="h-10 w-10 text-emerald-500/40" />
                          <p className="text-sm font-semibold text-zinc-300">¡Todo al día!</p>
                          <p className="text-xs text-zinc-500 max-w-xs leading-normal">
                            No hay incidencias reportadas en este momento. Las entregas marchan sin anomalías.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                        {/* ID */}
                        <td className="px-5 py-4 font-mono text-xs text-zinc-500">
                          RA-{item.id.slice(-5).toUpperCase()}
                        </td>
                        {/* Cliente */}
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white text-xs">{item.nombreCliente}</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">Producto: {item.producto}</div>
                        </td>
                        {/* Dirección */}
                        <td className="px-5 py-4 max-w-xs truncate text-zinc-400 text-xs">
                          {item.direccion}
                        </td>
                        {/* Motivo */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                            {item.motivoFallo || "No especificado"}
                          </span>
                        </td>
                        {/* Reportada */}
                        <td className="px-5 py-4 text-xs text-zinc-500 font-medium">
                          {formatTimeAgo(item.updatedAt)}
                        </td>
                        {/* Repartidor */}
                        <td className="px-5 py-4 text-xs text-zinc-400">
                          <span className="inline-flex items-center gap-1">
                            👤 {item.repartidorNombre}
                          </span>
                        </td>
                        {/* Acciones */}
                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5">
                            {item.clienteTelefono && (
                              <a 
                                href={`tel:${item.clienteTelefono}`}
                                title="Llamar destinatario"
                                className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </a>
                            )}
                            <Link 
                              href={`/dashboard/pedidos/${item.id}/editar`}
                              title="Editar pedido / Corregir Dirección"
                              className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              disabled={isPending}
                              onClick={() => handleReprogramar(item.id)}
                              title="Reintentar despacho (restablece a pendiente)"
                              className="grid h-7 w-7 place-items-center rounded-lg border border-purple-500/20 bg-purple-500/5 text-purple-400 hover:text-white hover:bg-purple-600 transition-colors disabled:opacity-40"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </PageWrapper>
  );
}

