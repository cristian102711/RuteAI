import prisma from "@ruteai/database";
import { BarChart3, TrendingUp, Package, AlertTriangle, Building2, Users, CheckCircle2, Clock, XCircle } from "lucide-react";

const PLAN_BADGE: Record<string, string> = {
  starter:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  pro:      "bg-blue-500/10 text-blue-400 border-blue-500/30",
  business: "bg-violet-500/10 text-violet-400 border-violet-500/30",
};

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  pendiente: { label: "Pendiente",  color: "text-amber-400",  bg: "bg-amber-500",   icon: Clock },
  en_ruta:   { label: "En Ruta",    color: "text-blue-400",   bg: "bg-blue-500",    icon: Package },
  entregado: { label: "Entregado",  color: "text-emerald-400",bg: "bg-emerald-500", icon: CheckCircle2 },
  fallido:   { label: "Fallido",    color: "text-red-400",    bg: "bg-red-500",     icon: XCircle },
};

export default async function AdminReportesPage() {
  const [empresas, pedidosStats, alertas, totalUsuarios, pedidosRecientes] = await Promise.all([
    prisma.empresa.findMany({
      include: {
        _count: { select: { pedidos: true, usuarios: true } },
        pedidos: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pedido.groupBy({
      by: ["estado"],
      _count: { _all: true },
    }),
    prisma.alerta.count({ where: { leida: false } }),
    prisma.usuario.count(),
    prisma.pedido.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { empresa: { select: { nombre: true } } },
    }),
  ]);

  const totalPedidos      = pedidosStats.reduce((a, p) => a + p._count._all, 0);
  const pedidosEntregados = pedidosStats.find((p) => p.estado === "entregado")?._count._all ?? 0;
  const pedidosPendientes = pedidosStats.find((p) => p.estado === "pendiente")?._count._all ?? 0;
  const pedidosEnRuta     = pedidosStats.find((p) => p.estado === "en_ruta")?._count._all ?? 0;
  const pedidosFallidos   = pedidosStats.find((p) => p.estado === "fallido")?._count._all ?? 0;
  const tasaExito = totalPedidos > 0 ? Math.round((pedidosEntregados / totalPedidos) * 100) : 0;

  // Distribución por plan
  const planDist = {
    starter:  empresas.filter((e) => e.plan === "starter").length,
    pro:      empresas.filter((e) => e.plan === "pro").length,
    business: empresas.filter((e) => e.plan === "business").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-violet-400 text-sm font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          Panel de Control
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          Reportes{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
            Globales
          </span>
        </h1>
        <p className="text-zinc-500 text-sm mt-2">Vista consolidada de todas las operaciones del sistema</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { label: "Total Pedidos",    value: totalPedidos,      dot: "bg-violet-500",  icon: Package },
          { label: "Total Empresas",   value: empresas.length,   dot: "bg-blue-500",    icon: Building2 },
          { label: "Total Usuarios",   value: totalUsuarios,     dot: "bg-emerald-500", icon: Users },
          { label: "Alertas sin leer", value: alertas,           dot: "bg-red-500",     icon: AlertTriangle },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 hover:border-zinc-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className={`w-2 h-2 rounded-full ${k.dot}`} />
                <Icon className="w-4 h-4 text-zinc-600" />
              </div>
              <p className="font-mono text-4xl font-extrabold text-white mb-1">{k.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Fila: Tasa de éxito + Desglose por estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Tasa de éxito */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Tasa de éxito global</p>
              <p className="font-mono text-5xl font-extrabold text-white">{tasaExito}<span className="text-2xl text-zinc-500">%</span></p>
            </div>
            <TrendingUp className={`w-8 h-8 ${tasaExito >= 70 ? "text-emerald-400" : tasaExito >= 40 ? "text-amber-400" : "text-red-400"} opacity-70`} />
          </div>
          {/* Barra segmentada */}
          <div className="space-y-3">
            {[
              { label: "Entregados", count: pedidosEntregados, color: "bg-emerald-500" },
              { label: "En Ruta",    count: pedidosEnRuta,     color: "bg-blue-500" },
              { label: "Pendientes", count: pedidosPendientes, color: "bg-amber-500" },
              { label: "Fallidos",   count: pedidosFallidos,   color: "bg-red-500" },
            ].map((item) => {
              const pct = totalPedidos > 0 ? Math.round((item.count / totalPedidos) * 100) : 0;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-500 w-20 shrink-0">{item.label}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                    <div className={`${item.color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-mono text-xs text-zinc-400 w-8 text-right">{item.count}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-zinc-600 mt-4">{pedidosEntregados} entregados de {totalPedidos} totales</p>
        </div>

        {/* Distribución por plan */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-5 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" /> Distribución por plan
          </p>
          <div className="space-y-4">
            {[
              { plan: "business", label: "Business", count: planDist.business, color: "bg-violet-500", badge: PLAN_BADGE.business },
              { plan: "pro",      label: "Pro",      count: planDist.pro,      color: "bg-blue-500",   badge: PLAN_BADGE.pro },
              { plan: "starter",  label: "Starter",  count: planDist.starter,  color: "bg-emerald-500",badge: PLAN_BADGE.starter },
            ].map((item) => {
              const pct = empresas.length > 0 ? Math.round((item.count / empresas.length) * 100) : 0;
              return (
                <div key={item.plan}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${item.badge}`}>
                      {item.label}
                    </span>
                    <span className="font-mono text-xs text-zinc-400">{item.count} empresa{item.count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen rápido */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
              <p className="font-mono text-2xl font-bold text-white">{empresas.filter(e => e.activa).length}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Activas</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
              <p className="font-mono text-2xl font-bold text-white">{empresas.filter(e => !e.activa).length}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Inactivas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" />
            Actividad reciente
          </h2>
          <span className="text-xs text-zinc-500 font-mono">últimos 6 pedidos</span>
        </div>
        <div className="divide-y divide-zinc-800/40">
          {pedidosRecientes.length === 0 ? (
            <p className="px-6 py-8 text-center text-zinc-600 text-sm">Sin actividad reciente</p>
          ) : (
            pedidosRecientes.map((pedido) => {
              const cfg = ESTADO_CONFIG[pedido.estado] ?? ESTADO_CONFIG.pendiente;
              const Icon = cfg.icon;
              return (
                <div key={pedido.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-800/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${cfg.bg}/10 border ${cfg.bg}/20 flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{pedido.nombreCliente}</p>
                      <p className="text-[11px] text-zinc-500 truncate max-w-xs">{pedido.direccion}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <span className="text-[11px] text-zinc-500">{pedido.empresa.nombre}</span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${cfg.color} bg-zinc-800/50 border-zinc-700`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Ranking por empresa */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Ranking por empresa</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/60">
              {["#", "Empresa", "Plan", "Usuarios", "Pedidos", "Última actividad", "Actividad"].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-zinc-500 font-mono">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {empresas
              .sort((a, b) => b._count.pedidos - a._count.pedidos)
              .map((empresa, idx) => {
                const maxPedidos = Math.max(...empresas.map((e) => e._count.pedidos), 1);
                const pct = Math.round((empresa._count.pedidos / maxPedidos) * 100);
                const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                const lastPedido = empresa.pedidos[0]?.createdAt;
                const diasSinActividad = lastPedido
                  ? Math.floor((Date.now() - new Date(lastPedido).getTime()) / 86_400_000)
                  : null;
                return (
                  <tr key={empresa.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-bold text-zinc-500">{medal}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{empresa.nombre}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{empresa.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${PLAN_BADGE[empresa.plan] ?? PLAN_BADGE.starter}`}>
                        {empresa.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-300">{empresa._count.usuarios}</td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-300">{empresa._count.pedidos}</td>
                    <td className="px-6 py-4">
                      {diasSinActividad === null ? (
                        <span className="text-[11px] text-zinc-600">Sin pedidos</span>
                      ) : diasSinActividad === 0 ? (
                        <span className="text-[11px] text-emerald-400 font-semibold">Hoy</span>
                      ) : (
                        <span className={`text-[11px] font-semibold ${
                          diasSinActividad <= 3 ? "text-emerald-400" :
                          diasSinActividad <= 7 ? "text-amber-400" : "text-red-400"
                        }`}>
                          hace {diasSinActividad} día{diasSinActividad !== 1 ? "s" : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-zinc-800 rounded-full h-1.5 min-w-[60px]">
                          <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono text-[10px] text-zinc-500 w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
