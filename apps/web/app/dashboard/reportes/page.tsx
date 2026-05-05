// app/dashboard/reportes/page.tsx
import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { BarChart3, TrendingUp, TrendingDown, Package, CheckCircle, XCircle, Clock } from "lucide-react";
import { GraficosReportes, GraficoTendenciaRiesgo } from "./GraficosReportes";

// Calcula los últimos 7 días con labels cortos
function obtenerUltimos7Dias() {
  const dias = [];
  const hoy = new Date();
  for (let i = 6; i >= 0; i--) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - i);
    dias.push({
      fecha,
      label: fecha.toLocaleDateString("es-CL", { weekday: "short", day: "numeric" }),
      inicio: new Date(fecha.setHours(0, 0, 0, 0)),
      fin: new Date(new Date(fecha).setHours(23, 59, 59, 999)),
    });
  }
  return dias;
}

export default async function ReportesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true },
  });

  if (!usuarioDB || !usuarioDB.empresa) redirect("/dashboard");

  const empresaId = usuarioDB.empresa.id;

  // ── Traer TODOS los pedidos de la empresa ──────────────────────
  const pedidos = await prisma.pedido.findMany({
    where: { empresaId },
    include: {
      repartidor: { select: { id: true, nombre: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // ── Métricas generales ─────────────────────────────────────────
  const total = pedidos.length;
  const entregados = pedidos.filter((p) => p.estado === "entregado").length;
  const enRuta = pedidos.filter((p) => p.estado === "en_ruta").length;
  const fallidos = pedidos.filter((p) => p.estado === "fallido").length;
  const pendientes = pedidos.filter((p) => p.estado === "pendiente").length;
  const tasaExito = total > 0 ? Math.round((entregados / total) * 100) : 0;
  const scoreRiesgoPromedio = pedidos.length > 0
    ? Math.round(
        pedidos.reduce((acc, p) => acc + (p.scoreRiesgo ?? 0), 0) / pedidos.length * 100
      ) / 100
    : 0;

  // ── Pedidos por día (últimos 7 días) ───────────────────────────
  const dias = obtenerUltimos7Dias();
  const datosPorDia = dias.map(({ label, inicio, fin }) => {
    const delDia = pedidos.filter(
      (p) => new Date(p.createdAt) >= inicio && new Date(p.createdAt) <= fin
    );
    return {
      dia: label,
      total: delDia.length,
      entregados: delDia.filter((p) => p.estado === "entregado").length,
      fallidos: delDia.filter((p) => p.estado === "fallido").length,
    };
  });

  // ── Eficiencia por repartidor ──────────────────────────────────
  const repartidoresMap = new Map<string, { nombre: string; total: number; entregados: number }>();
  pedidos.forEach((p) => {
    if (!p.repartidor) return;
    const r = repartidoresMap.get(p.repartidor.id) ?? {
      nombre: p.repartidor.nombre,
      total: 0,
      entregados: 0,
    };
    r.total++;
    if (p.estado === "entregado") r.entregados++;
    repartidoresMap.set(p.repartidor.id, r);
  });

  const datosPorRepartidor = Array.from(repartidoresMap.values()).map((r) => ({
    nombre: r.nombre,
    total: r.total,
    entregados: r.entregados,
    eficiencia: r.total > 0 ? Math.round((r.entregados / r.total) * 100) : 0,
  }));

  // ── Distribución por estado (para Pie chart) ───────────────────
  const distribucionEstados = [
    { name: "Entregados", value: entregados, color: "#10b981" },
    { name: "En ruta", value: enRuta, color: "#3b82f6" },
    { name: "Pendientes", value: pendientes, color: "#f59e0b" },
    { name: "Fallidos", value: fallidos, color: "#f43f5e" },
  ];

  // ── Tarjetas de métricas ───────────────────────────────────────
  const tarjetas = [
    {
      label: "Total Despachos",
      valor: total,
      sufijo: "",
      icono: Package,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Tasa de Éxito",
      valor: tasaExito,
      sufijo: "%",
      icono: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Entregados",
      valor: entregados,
      sufijo: "",
      icono: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "En Ruta Ahora",
      valor: enRuta,
      sufijo: "",
      icono: Clock,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Fallidos",
      valor: fallidos,
      sufijo: "",
      icono: XCircle,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      label: "Score IA Promedio",
      valor: scoreRiesgoPromedio,
      sufijo: "",
      icono: TrendingDown,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  return (
    <div className="font-sans px-2">
      <div className="max-w-[85rem] mx-auto">

        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800/50 pb-6">
          <div>
            <span className="text-purple-400 text-sm font-semibold tracking-widest uppercase mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Análisis y Métricas
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
              Reportes{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Inteligentes
              </span>
            </h1>
            <p className="text-zinc-500 text-sm">
              {usuarioDB.empresa.nombre} · Últimos 7 días y totales históricos
            </p>
          </div>
          <div className="mt-4 md:mt-0 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold px-4 py-2.5 rounded-2xl">
            {total} despachos totales
          </div>
        </header>

        {/* Tarjetas de métricas */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
          {tarjetas.map((t) => {
            const Icono = t.icono;
            return (
              <div
                key={t.label}
                className={`${t.bg} border ${t.border} rounded-2xl p-5 flex flex-col gap-2`}
              >
                <div className={`w-8 h-8 rounded-lg ${t.bg} border ${t.border} flex items-center justify-center`}>
                  <Icono className={`w-4 h-4 ${t.color}`} />
                </div>
                <p className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider leading-none">
                  {t.label}
                </p>
                <p className={`text-3xl font-extrabold leading-none ${t.color}`}>
                  {t.valor}
                  <span className="text-base font-bold">{t.sufijo}</span>
                </p>
              </div>
            );
          })}
        </div>

        {/* Gráficos */}
        <GraficosReportes
          datosPorDia={datosPorDia}
          datosPorRepartidor={datosPorRepartidor}
          distribucionEstados={distribucionEstados}
        />

        {/* Gráfico de tendencia (row completo) */}
        <div className="mt-6">
          <GraficoTendenciaRiesgo datosPorDia={datosPorDia} />
        </div>

        {/* Tabla de pedidos recientes */}
        <div className="mt-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-400 mb-4">
            📋 Últimos 10 despachos
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800/60">
                  <th className="pb-3 text-left font-semibold">Cliente</th>
                  <th className="pb-3 text-left font-semibold">Dirección</th>
                  <th className="pb-3 text-left font-semibold">Estado</th>
                  <th className="pb-3 text-left font-semibold">Repartidor</th>
                  <th className="pb-3 text-right font-semibold">Score IA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {pedidos.slice(0, 10).map((p) => {
                  const estadoConfig: Record<string, { color: string; label: string }> = {
                    pendiente: { color: "text-amber-400 bg-amber-500/10", label: "Pendiente" },
                    en_ruta: { color: "text-blue-400 bg-blue-500/10", label: "En Ruta" },
                    entregado: { color: "text-emerald-400 bg-emerald-500/10", label: "Entregado" },
                    fallido: { color: "text-rose-400 bg-rose-500/10", label: "Fallido" },
                  };
                  const cfg = estadoConfig[p.estado] ?? estadoConfig["pendiente"];

                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="py-3 pr-4 text-zinc-200 font-medium">{p.nombreCliente}</td>
                      <td className="py-3 pr-4 text-zinc-500 truncate max-w-[180px]">{p.direccion}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-zinc-400 text-xs">
                        {p.repartidor?.nombre ?? "—"}
                      </td>
                      <td className="py-3 text-right font-mono text-xs text-zinc-400">
                        {p.scoreRiesgo !== null && p.scoreRiesgo !== undefined
                          ? `${p.scoreRiesgo}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
                {pedidos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-zinc-600">
                      No hay despachos registrados aún
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
