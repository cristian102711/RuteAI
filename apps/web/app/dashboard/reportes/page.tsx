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
    <div className="px-2 pb-10">
      <div className="max-w-[85rem] mx-auto">

        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border-ui pb-8">
          <div>
            <span className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Análisis y Métricas
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-2">
              Reportes{" "}
              <span className="text-primary">
                Inteligentes
              </span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              {usuarioDB.empresa.nombre} · Análisis detallado de los últimos 7 días
            </p>
          </div>
          <div className="mt-4 md:mt-0 bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm">
            {total} despachos totales
          </div>
        </header>

        {/* Tarjetas de métricas */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
          {tarjetas.map((t) => {
            const Icono = t.icono;
            // Map colors to semantic classes
            const colorMap: Record<string, string> = {
              "text-blue-400": "text-blue-500",
              "text-emerald-400": "text-emerald-500",
              "text-rose-400": "text-rose-500",
              "text-amber-400": "text-amber-500"
            };
            const semanticColor = colorMap[t.color] || t.color;
            const semanticBg = semanticColor.replace("text-", "bg-") + "/10";
            const semanticBorder = semanticColor.replace("text-", "border-") + "/20";

            return (
              <div
                key={t.label}
                className={`bg-card border border-border-ui rounded-2xl p-5 flex flex-col gap-2 shadow-sm hover:shadow-md transition-all duration-300`}
              >
                <div className={`w-8 h-8 rounded-lg ${semanticBg} border ${semanticBorder} flex items-center justify-center`}>
                  <Icono className={`w-4 h-4 ${semanticColor}`} />
                </div>
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider leading-none">
                  {t.label}
                </p>
                <p className={`text-2xl font-black leading-none ${semanticColor}`}>
                  {t.valor}
                  <span className="text-sm font-bold ml-0.5">{t.sufijo}</span>
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
        <div className="mt-8">
          <GraficoTendenciaRiesgo datosPorDia={datosPorDia} />
        </div>

        {/* Tabla de pedidos recientes */}
        <div className="mt-8 bg-card border border-border-ui rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
            Últimos 10 despachos
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-[10px] uppercase tracking-wider border-b border-border-ui">
                  <th className="pb-4 text-left font-bold">Cliente</th>
                  <th className="pb-4 text-left font-bold">Dirección</th>
                  <th className="pb-4 text-left font-bold">Estado</th>
                  <th className="pb-4 text-left font-bold">Repartidor</th>
                  <th className="pb-4 text-right font-bold">Score IA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-ui/40">
                {pedidos.slice(0, 10).map((p) => {
                  const estadoConfig: Record<string, { color: string; label: string }> = {
                    pendiente: { color: "text-amber-600 dark:text-amber-400 bg-amber-500/10", label: "Pendiente" },
                    en_ruta: { color: "text-blue-600 dark:text-blue-400 bg-blue-500/10", label: "En Ruta" },
                    entregado: { color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10", label: "Entregado" },
                    fallido: { color: "text-rose-600 dark:text-rose-400 bg-rose-500/10", label: "Fallido" },
                  };
                  const cfg = estadoConfig[p.estado] ?? estadoConfig["pendiente"];

                  return (
                    <tr key={p.id} className="hover:bg-secondary/30 transition-colors group">
                      <td className="py-4 pr-4 text-foreground font-bold">{p.nombreCliente}</td>
                      <td className="py-4 pr-4 text-muted-foreground truncate max-w-[180px] font-medium">{p.direccion}</td>
                      <td className="py-4 pr-4">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tight ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-muted-foreground text-xs font-medium">
                        {p.repartidor?.nombre ?? "—"}
                      </td>
                      <td className="py-4 text-right font-bold text-xs text-foreground">
                        {p.scoreRiesgo !== null && p.scoreRiesgo !== undefined
                          ? `${p.scoreRiesgo}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
                {pedidos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-muted-foreground font-medium">
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
