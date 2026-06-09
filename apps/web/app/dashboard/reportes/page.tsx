import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Fuel, Clock, TrendingUp, Leaf, Sparkles } from "lucide-react";
import ExportarReportePDF from "./ExportarReportePDF";

// Calcula el ahorro estimado por mes (basado en pedidos entregados)
// Cada entrega exitosa ≈ ahorra 1.2 L de combustible vs ruta no optimizada
const LITROS_POR_ENTREGA = 1.2;
const PRECIO_LITRO_CLP = 1100; // CLP aprox.
const KG_CO2_POR_LITRO = 2.38;
const HORAS_AHORRADAS_POR_ENTREGA = 0.15; // 9 min promedio por IA

export default async function ReportesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true },
  });
  if (!usuarioDB?.empresa) redirect("/login");

  const empresaId = usuarioDB.empresa.id;

  // ── Pedidos de los últimos 6 meses (para el gráfico) ──────────
  const seisMesesAtras = new Date();
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5);
  seisMesesAtras.setDate(1);
  seisMesesAtras.setHours(0, 0, 0, 0);

  const pedidosSeisMeses = await prisma.pedido.findMany({
    where: {
      empresaId,
      createdAt: { gte: seisMesesAtras },
    },
    select: {
      id: true,
      estado: true,
      motivoFallo: true,
      createdAt: true,
    },
  });

  // ── KPIs del día/hoy ──────────────────────────────────────────
  const pedidosHoy = await prisma.pedido.findMany({
    where: {
      empresaId,
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
    select: { estado: true },
  });

  const entregadosHoy = pedidosHoy.filter((p) => p.estado === "entregado").length;
  const totalHoy = pedidosHoy.length;
  const tasaExito =
    totalHoy > 0 ? Math.round((entregadosHoy / totalHoy) * 100) : 0;

  // ── Totales acumulados de 6 meses ────────────────────────────
  const totalEntregados6m = pedidosSeisMeses.filter(
    (p) => p.estado === "entregado"
  ).length;

  const litrosAhorrados = Math.round(totalEntregados6m * LITROS_POR_ENTREGA);
  const ahorroClp = litrosAhorrados * PRECIO_LITRO_CLP;
  const co2Evitado = Math.round(litrosAhorrados * KG_CO2_POR_LITRO);
  const arbolesEquivalentes = Math.round(co2Evitado / 21);
  const horasRecuperadas = Math.round(totalEntregados6m * HORAS_AHORRADAS_POR_ENTREGA);

  // ── Datos para el gráfico de 6 meses ─────────────────────────
  const nombresMes = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const graficoMeses = Array.from({ length: 6 }).map((_, i) => {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - (5 - i));
    const mes = fecha.getMonth();
    const anio = fecha.getFullYear();

    const pedidosMes = pedidosSeisMeses.filter((p) => {
      const d = new Date(p.createdAt);
      return d.getMonth() === mes && d.getFullYear() === anio;
    });

    const entregadosMes = pedidosMes.filter((p) => p.estado === "entregado").length;
    const totalMes = pedidosMes.length;

    // Costos estimados (sin IA vs con IA)
    const costSinIA = totalMes * LITROS_POR_ENTREGA * 1.35 * PRECIO_LITRO_CLP; // 35% más sin optimización
    const costConIA = totalMes * LITROS_POR_ENTREGA * PRECIO_LITRO_CLP;
    const maxCost = costSinIA > 0 ? costSinIA : 1;

    return {
      nombre: nombresMes[mes],
      totalMes,
      entregadosMes,
      // Alturas proporcionales al máximo para el gráfico (max 200px)
      hSinIA: Math.round((costSinIA / maxCost) * 180),
      hConIA: Math.round((costConIA / maxCost) * 180),
      tasaMes: totalMes > 0 ? Math.round((entregadosMes / totalMes) * 100) : 0,
    };
  });

  const maxBarHeight = Math.max(...graficoMeses.map((m) => m.hSinIA), 1);
  const graficoNormalizado = graficoMeses.map((m) => ({
    ...m,
    hSinIA: Math.round((m.hSinIA / maxBarHeight) * 190),
    hConIA: Math.round((m.hConIA / maxBarHeight) * 190),
  }));

  // ── Motivos de fallo reales ───────────────────────────────────
  const pedidosFallidos = pedidosSeisMeses.filter(
    (p) => p.estado === "fallido"
  );
  const totalFallidos = pedidosFallidos.length;

  // Contar por motivoFallo real
  const motivosMap: Record<string, number> = {};
  pedidosFallidos.forEach((p) => {
    const motivo = p.motivoFallo?.trim() || "Sin motivo registrado";
    motivosMap[motivo] = (motivosMap[motivo] ?? 0) + 1;
  });

  // Convertir a array ordenado
  const motivosFallo =
    totalFallidos > 0
      ? Object.entries(motivosMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([causa, count]) => ({
            causa,
            percent: Math.round((count / totalFallidos) * 100),
            count,
          }))
      : [];

  // Tasas de éxito semanal
  const tasaExito6m =
    pedidosSeisMeses.length > 0
      ? Math.round(
          (pedidosSeisMeses.filter((p) => p.estado === "entregado").length /
            pedidosSeisMeses.length) *
            100
        )
      : 0;

  // Fecha actual formateada
  const mesActual = new Date().toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
  const mesCapitalizado = mesActual.charAt(0).toUpperCase() + mesActual.slice(1);

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto text-zinc-100 selection:bg-purple-500/30">

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-500 font-bold">
            Analítica
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
            Reportes de operación
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {mesCapitalizado} · {usuarioDB.empresa.nombre} · Últimos 6 meses
          </p>
        </div>
        <ExportarReportePDF
          empresaNombre={usuarioDB.empresa.nombre}
          mes={mesCapitalizado}
          kpis={{
            combustible: litrosAhorrados,
            ahorroClp,
            tiempo: horasRecuperadas,
            tasaExito: tasaExito6m,
            co2: co2Evitado,
            pedidosTotal: pedidosSeisMeses.length,
            pedidosEntregados: totalEntregados6m,
          }}
        />
      </div>

      {/* Grid 4 KPIs — 100% calculados desde pedidos reales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
            <Fuel className="h-3.5 w-3.5" /> Combustible ahorrado
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-purple-500">
            {litrosAhorrados} L
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            ≈ ${ahorroClp.toLocaleString("es-CL")} CLP ahorrado
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
            <Clock className="h-3.5 w-3.5" /> Tiempo recuperado
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-purple-500">
            {horasRecuperadas} h
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            vs rutas no optimizadas · 6 meses
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
            <TrendingUp className="h-3.5 w-3.5" /> Tasa de éxito
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-purple-500">
            {tasaExito6m}%
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            {totalEntregados6m} de {pedidosSeisMeses.length} pedidos entregados
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
            <Leaf className="h-3.5 w-3.5" /> CO₂ evitado
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-purple-500">
            {co2Evitado} kg
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            equiv. {arbolesEquivalentes} árbol{arbolesEquivalentes !== 1 ? "es" : ""}
          </div>
        </div>

      </div>

      {/* Grid Gráfico + Motivos de Fallo */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Gráfico mensual real */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Ahorro mensual gracias a la IA
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Costo estimado sin IA vs con RouteAI · últimos 6 meses
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded bg-purple-500/15 px-2 py-0.5 text-xs text-purple-400 ring-1 ring-inset ring-purple-500/20">
              <Sparkles className="h-3 w-3" /> Modelo v2.1
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-zinc-400">
              <span className="h-2 w-2 rounded bg-white/15" /> Sin IA (estimado)
            </span>
            <span className="inline-flex items-center gap-1.5 text-zinc-400">
              <span className="h-2 w-2 rounded bg-amber-500" /> Con RouteAI
            </span>
          </div>

          {pedidosSeisMeses.length === 0 ? (
            <div className="mt-6 flex h-52 items-center justify-center text-center">
              <p className="text-zinc-500 text-sm">
                Sin datos de pedidos en los últimos 6 meses.
              </p>
            </div>
          ) : (
            <div className="mt-6 flex h-52 items-end gap-4">
              {graficoNormalizado.map((mes) => (
                <div
                  key={mes.nombre}
                  className="flex flex-1 flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="w-full text-center">
                    <span className="text-[9px] text-zinc-600 group-hover:text-zinc-400 transition-colors">
                      {mes.tasaMes}%
                    </span>
                  </div>
                  <div className="flex w-full items-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <div
                      className="flex-1 rounded-sm bg-white/10 group-hover:bg-white/20 transition-colors"
                      style={{ height: `${mes.hSinIA}px` }}
                      title={`Sin IA · ${mes.totalMes} pedidos`}
                    />
                    <div
                      className="flex-1 rounded-sm bg-gradient-to-t from-amber-500 to-purple-500"
                      style={{ height: `${mes.hConIA}px` }}
                      title={`Con IA · ${mes.entregadosMes} entregados`}
                    />
                  </div>
                  <div className="text-[11px] text-zinc-500 group-hover:text-white transition-colors">
                    {mes.nombre}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Motivos de fallo reales */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              Top motivos de fallo
            </h3>
            <span className="text-xs text-zinc-500 font-mono">
              {totalFallidos} fallidos
            </span>
          </div>

          {motivosFallo.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-2xl mb-2">🎉</span>
              <p className="text-sm text-zinc-400 font-medium">
                Sin entregas fallidas
              </p>
              <p className="text-xs text-zinc-600 mt-1">en los últimos 6 meses</p>
            </div>
          ) : (
            <ul className="space-y-4 text-sm">
              {motivosFallo.map((motivo) => (
                <li key={motivo.causa} className="group">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-300 group-hover:text-white transition-colors truncate max-w-[160px]">
                      {motivo.causa}
                    </span>
                    <span className="font-mono text-zinc-500 ml-2 shrink-0">
                      {motivo.percent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-purple-500 rounded-full transition-all duration-700"
                      style={{ width: `${motivo.percent}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      {/* Nota al pie */}
      <p className="text-xs text-zinc-600">
        * Los valores de combustible, CO₂ y tiempo son estimaciones basadas en{" "}
        {totalEntregados6m} entregas exitosas registradas · 1.2 L / entrega · 9 min ahorrados por IA
      </p>
    </div>
  );
}
