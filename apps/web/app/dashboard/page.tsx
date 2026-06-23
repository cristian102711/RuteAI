import prisma from "@ruteai/database";
import { FilaPedido } from "./components/FilaPedido";
import { createClient } from "@/lib/supabaseServer";
import { crearEmpresaYUsuario } from "./actions";
import Link from "next/link";
import {
  Package, CheckSquare, Users, AlertTriangle,
  Sparkles, ArrowRight, Clock, Timer, Gauge,
  MapPin, Truck, Bike, Car, Radio, Zap
} from "lucide-react";
import { calcularMetricasSLA, formatearAtraso } from "@/lib/logistica";

// Server component para la gestión de RouteAI Dashboard conectado a datos reales sin fallbacks ficticios
export default async function DashboardPage() {
  
  // 1. Obtener al usuario real que inició sesión desde Supabase Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div className="p-10 text-xl font-bold text-red-400 bg-zinc-950 h-screen">🚨 Error: Sesión no válida.</div>;
  }

  // 2. Buscar en nuestra tabla 'Usuario' de Prisma usando el ID de Supabase
  // Si no se encuentra por ID, buscar por email como fallback
  // (puede haber diferencia de ID si el usuario fue creado con otro método de login)
  let usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true }
  });

  if (!usuarioDB && user.email) {
    usuarioDB = await prisma.usuario.findUnique({
      where: { email: user.email },
      include: { empresa: true }
    });
  }
  
  if (!usuarioDB || !usuarioDB.empresa) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-white font-sans">
        <div className="max-w-md w-full bg-zinc-900/60 backdrop-blur-xl border border-white/[0.04] rounded-3xl p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-amber-600 to-purple-600" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-[50px] group-hover:bg-amber-500/20 transition-all duration-700" />

          <h1 className="text-3xl font-extrabold mb-3 tracking-tight">¡Bienvenido a <span className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">RouteAI</span>! 🎉</h1>
          <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
            Para comenzar a operar, necesitamos el nombre de tu empresa. Todos los datos logísticos estarán protegidos bajo este entorno seguro.
          </p>
          
          <form action={crearEmpresaYUsuario} className="flex flex-col gap-5 relative z-10">
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="userEmail" value={user.email || ""} />
            
            <div className="flex flex-col gap-2">
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                Nombre de Flota empresarial
              </label>
              <input 
                name="nombreEmpresa" 
                placeholder="Ej: Awna Logistics SPA" 
                required
                className="w-full bg-zinc-950/80 border border-white/[0.04] text-white placeholder-zinc-700 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 shadow-inner transition-all font-medium text-sm"
              />
            </div>

            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] text-zinc-950 font-extrabold py-4 mt-2 rounded-2xl transition-all duration-300 active:scale-95 tracking-wide">
              Crear Empresa y Entrar al Panel
            </button>
          </form>
          
        </div>
      </div>
    );
  }

  // 3. Obtención de Datos de la Base de Datos (Multi-Tenant Real)
  const empresaActiva = usuarioDB.empresa;
  
  // Extraer ubicación dinámica de la configuración guardada
  const configuracion = (empresaActiva.configuracion ?? {}) as { pais?: string; direccion?: string };
  // Intentar obtener la ciudad desde la dirección o usar el país; de lo contrario fallback a Chile
  let ubicacionTexto = "Chile";
  if (configuracion.pais) {
    ubicacionTexto = configuracion.pais;
  } else if (configuracion.direccion) {
    // Si hay dirección, intentar tomar la última parte tras la coma como ciudad/región
    const partes = configuracion.direccion.split(",");
    if (partes.length > 0) {
      ubicacionTexto = partes[partes.length - 1].trim();
    }
  }

  // Obtener pedidos
  const pedidos = await prisma.pedido.findMany({
    where: { empresaId: empresaActiva.id },
    orderBy: { createdAt: "desc" },
  });

  const conductoresTotales = await prisma.usuario.count({
    where: { empresaId: empresaActiva.id, rol: "repartidor" }
  });

  const ultimaAlertaReal = await prisma.alerta.findFirst({
    where: { empresaId: empresaActiva.id, leida: false },
    orderBy: { createdAt: "desc" }
  });

  // KPIs 100% reales basados en la base de datos
  const pedidosDelDia = pedidos.length;
  const entregados = pedidos.filter((p: any) => p.estado === "entregado").length;
  const fallidos = pedidos.filter((p: any) => p.estado === "fallido").length;
  const enRuta = pedidos.filter((p: any) => p.estado === "en_ruta").length;
  const avancePorcentaje = pedidosDelDia > 0 ? Math.round((entregados / pedidosDelDia) * 100) : 0;

  // Métricas SLA / cumplimiento de horario (atraso derivado, sin cron)
  const sla = calcularMetricasSLA(pedidos as any);

  // Fecha bonita actual en español
  const hoyFormatted = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  const hoyCapitalized = hoyFormatted.charAt(0).toUpperCase() + hoyFormatted.slice(1);

  // 4. Historial real de los últimos 7 días
  const sieteDiasAtras = new Date();
  sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);

  const pedidosDeLaSemana = await prisma.pedido.findMany({
    where: {
      empresaId: empresaActiva.id,
      createdAt: { gte: sieteDiasAtras }
    }
  });

  // Agrupar pedidos por día de la semana
  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const graficoSemanalData = Array.from({ length: 7 }).map((_, i: number) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const nombreDia = diasSemana[d.getDay()];
    
    // Contar pedidos de ese día específico
    const pedidosDia = pedidosDeLaSemana.filter((p: any) => {
      const pDate = new Date(p.createdAt);
      return pDate.getDate() === d.getDate() && pDate.getMonth() === d.getMonth();
    });

    const successCount = pedidosDia.filter((p: any) => p.estado === "entregado").length;
    const failedCount = pedidosDia.filter((p: any) => p.estado === "fallido").length;

    return {
      day: nombreDia,
      exitososPx: successCount * 20, 
      fallidosPx: failedCount * 20,
      totalCount: pedidosDia.length
    };
  });

  const tasaExitoReal = pedidosDeLaSemana.length > 0 
    ? Math.round((pedidosDeLaSemana.filter((p: any) => p.estado === "entregado").length / pedidosDeLaSemana.length) * 100)
    : 0;

  // 5. Datos de flota: repartidores con su última ubicación y pedidos asignados
  const repartidoresFlota = await prisma.usuario.findMany({
    where: { empresaId: empresaActiva.id, rol: "repartidor" },
    select: {
      id: true, nombre: true, vehiculo: true, patente: true,
      _count: { select: { pedidosAsignados: { where: { estado: { in: ["pendiente", "en_ruta"] } } } } },
    },
    orderBy: { nombre: "asc" },
    take: 6,
  });

  // Última ubicación GPS de cada repartidor
  const flotaConGPS = await Promise.all(
    repartidoresFlota.map(async (rep) => {
      const ultimaUbi = await prisma.ubicacion.findFirst({
        where: { repartidorId: rep.id },
        orderBy: { timestamp: "desc" },
        select: { timestamp: true },
      });
      const minutosDesdeUltimo = ultimaUbi
        ? Math.round((Date.now() - new Date(ultimaUbi.timestamp).getTime()) / 60000)
        : null;
      return {
        ...rep,
        pedidosActivos: rep._count.pedidosAsignados,
        ultimoPing: minutosDesdeUltimo,
        online: minutosDesdeUltimo !== null && minutosDesdeUltimo < 30,
      };
    })
  );

  return (
    <div className="space-y-6 text-white">
      {/* Título Superior */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-amber-500">Operación en Vivo</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
            {empresaActiva.nombre} · {ubicacionTexto}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {hoyCapitalized} · {conductoresTotales} repartidores registrados · {pedidosDelDia} pedidos totales
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-2 text-sm text-zinc-300">
            <span className={`h-2 w-2 rounded-full ${empresaActiva.planEstado === 'activo' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            Plan <strong>{empresaActiva.plan?.toUpperCase()}</strong> · Vence: {empresaActiva.planFechaVencimiento ? new Date(empresaActiva.planFechaVencimiento).toLocaleDateString() : 'N/A'}
          </div>
          <Link
            href="/dashboard/pedidos"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(167,139,250,0.15)] hover:opacity-90 transition active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, hsl(271 81% 66%), hsl(300 74% 40%))" }}
          >
            <Zap className="h-4 w-4" />
            Optimizar Rutas con IA
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Pedidos del día */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <Package className="h-3.5 w-3.5 text-amber-500" />
              Pedidos del día
            </div>
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">{pedidosDelDia}</div>
          <div className="mt-1 text-xs text-zinc-500">{enRuta} actualmente en ruta</div>
        </div>

        {/* Card 2: Entregados */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
              Entregados
            </div>
            {entregados > 0 && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">{entregados}</div>
          <div className="mt-1 text-xs text-zinc-500">{avancePorcentaje}% de avance</div>
        </div>

        {/* Card 3: Fallidos */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
              Fallidos
            </div>
            {fallidos > 0 && <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">{fallidos}</div>
          <div className="mt-1 text-xs text-zinc-500">{fallidos === 0 ? "Sin incidencias hoy" : `${fallidos} entrega(s) fallida(s)`}</div>
        </div>

        {/* Card 4: Repartidores */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <Users className="h-3.5 w-3.5 text-purple-400" />
              Repartidores
            </div>
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">{conductoresTotales}</div>
          <div className="mt-1 text-xs text-zinc-500">{conductoresTotales > 0 ? "Conductores activos" : "Sin conductores"}</div>
        </div>

      </div>

      {/* Cumplimiento de SLA / Horarios de entrega */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Atrasados ahora */}
        <div className={`rounded-xl border p-5 shadow-lg backdrop-blur-xl ${sla.atrasadosActivos > 0 ? "border-rose-500/30 bg-rose-500/[0.04]" : "border-white/[0.04] bg-white/[0.02]"}`}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <Clock className="h-3.5 w-3.5 text-rose-400" />
            Atrasados ahora
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">{sla.atrasadosActivos}</div>
          <div className="mt-1 text-xs text-zinc-500">
            {sla.atrasadosActivos > 0 ? "Pedidos fuera de plazo SLA" : "Todo dentro de plazo"}
          </div>
        </div>

        {/* OTD — On-Time Delivery */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <Gauge className="h-3.5 w-3.5 text-emerald-400" />
            Entregas a tiempo (OTD)
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">{sla.otd}%</div>
          <div className="mt-1 text-xs text-zinc-500">
            {sla.entregadosATiempo}/{sla.entregados} entregas dentro de plazo
          </div>
        </div>

        {/* Atraso promedio */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <Timer className="h-3.5 w-3.5 text-amber-400" />
            Atraso promedio
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">
            {sla.atrasoPromedioMin > 0 ? formatearAtraso(sla.atrasoPromedioMin) : "—"}
          </div>
          <div className="mt-1 text-xs text-zinc-500">En las entregas fuera de plazo</div>
        </div>
      </div>

      {/* Grid del medio: Reporte y Sugerencia IA */}
      <div className="grid gap-4 lg:grid-cols-3">
        
        {/* Gráfico de barras de la semana */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 lg:col-span-2 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Desempeño de despachos · semana</h3>
              <p className="text-xs text-zinc-500">Últimos 7 días de entregas</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {tasaExitoReal}% éxito semanal
            </span>
          </div>

          <div className="mt-6 flex h-56 items-end gap-3 px-2">
            {graficoSemanalData.map((d, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-col items-center gap-1">
                  {/* Barra fallidos */}
                  {d.fallidosPx > 0 && (
                    <div className="w-full rounded-sm bg-rose-500/40" style={{ height: `${d.fallidosPx}px` }} title={`${d.fallidosPx / 20} fallidos`} />
                  )}
                  {/* Barra exitosos */}
                  {d.exitososPx > 0 ? (
                    <div className="w-full rounded-sm bg-gradient-to-t from-amber-500 to-yellow-400" style={{ height: `${d.exitososPx}px` }} title={`${d.exitososPx / 20} exitosos`} />
                  ) : (
                    <div className="w-full rounded-sm bg-white/5" style={{ height: "4px" }} />
                  )}
                </div>
                <div className="text-[11px] text-zinc-500 font-medium">{d.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sugerencias de IA basadas en Alertas reales */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 shadow-lg backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-100">Sugerencia / Alerta IA</h3>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>

          {ultimaAlertaReal ? (
            <div className="mt-4 rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Riesgo detectado</div>
              <p className="mt-2 text-sm text-zinc-200 leading-relaxed">
                {ultimaAlertaReal.mensaje}
              </p>
              <button className="mt-4 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-md active:scale-95 transition"
                style={{ background: "linear-gradient(to right, hsl(271 81% 66%), hsl(300 74% 40%))" }}>
                Resolver Riesgo
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Operación Óptima</div>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed font-normal">
                La Inteligencia Artificial de RouteAI no ha detectado desvíos ni riesgos en las rutas de hoy.
              </p>
            </div>
          )}

          <div className="mt-4 space-y-2 border-t border-white/[0.04] pt-3 text-xs text-zinc-500">
            <div className="flex justify-between">
              <span>Modelo de IA</span>
              <span className="font-mono text-zinc-300">gpt-oss-120b:free</span>
            </div>
            <div className="flex justify-between">
              <span>Alertas pendientes</span>
              <span className="font-mono text-zinc-300">{ultimaAlertaReal ? "1 activa" : "0 activas"}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Grid inferior: Flota y paradas */}
      <div className="grid gap-4 lg:grid-cols-3">
        
        {/* Panel de Actividad de Flota */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] lg:col-span-2 shadow-lg backdrop-blur-xl">
          <div className="border-b border-white/[0.04] px-5 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Actividad de Flota</h3>
              <p className="text-xs text-zinc-500">{flotaConGPS.length} repartidores registrados · {flotaConGPS.filter(r => r.online).length} en línea</p>
            </div>
            <Link href="/dashboard/rutas" className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors">
              <MapPin className="h-3 w-3" /> Ver mapa GPS
            </Link>
          </div>

          {flotaConGPS.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mb-3 border border-white/[0.04]">
                <Truck className="h-5 w-5 text-zinc-500" />
              </div>
              <p className="text-zinc-400 text-sm font-medium">Sin repartidores</p>
              <p className="text-zinc-600 text-xs mt-1">Invita a tu equipo desde la sección Equipo.</p>
            </div>
          ) : (
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {flotaConGPS.map((rep) => {
                const VehicleIcon = rep.vehiculo?.toLowerCase().includes("moto") ? Bike
                  : rep.vehiculo?.toLowerCase().includes("furg") ? Truck
                  : Car;
                return (
                  <div key={rep.id} className="relative rounded-xl border border-white/[0.04] bg-zinc-900/40 p-4 hover:border-white/[0.08] transition-all group">
                    {/* Indicador online/offline */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${rep.online ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-zinc-600"}`}>
                          {rep.online && <span className="block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />}
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          {rep.online ? "En línea" : "Offline"}
                        </span>
                      </div>
                      <VehicleIcon className="h-3.5 w-3.5 text-zinc-600" />
                    </div>
                    
                    {/* Nombre y vehículo */}
                    <div className="text-sm font-semibold text-zinc-200 truncate">{rep.nombre}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 truncate">
                      {rep.vehiculo || "Sin vehículo"}{rep.patente ? ` · ${rep.patente}` : ""}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.04]">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3 text-amber-500/70" />
                        <span className="text-xs font-medium text-zinc-300">{rep.pedidosActivos}</span>
                        <span className="text-[10px] text-zinc-600">activos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Radio className="h-3 w-3 text-zinc-500/70" />
                        <span className="text-[10px] text-zinc-500">
                          {rep.ultimoPing !== null
                            ? rep.ultimoPing < 1 ? "Ahora"
                            : rep.ultimoPing < 60 ? `${rep.ultimoPing}min`
                            : `${Math.round(rep.ultimoPing / 60)}h`
                            : "Sin GPS"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Listado de próximas paradas (despachos pendientes) */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] shadow-lg backdrop-blur-xl flex flex-col">
          <div className="border-b border-white/[0.04] px-5 py-4">
            <h3 className="text-sm font-semibold text-zinc-100">Próximas entregas</h3>
            <p className="text-xs text-zinc-500">Cola de despachos en espera</p>
          </div>

          <ol className="divide-y divide-white/[0.03] flex-1 overflow-y-auto max-h-[380px]">
            {pedidos.filter((p: any) => p.estado === "pendiente" || p.estado === "en_ruta").length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full text-zinc-500">
                <span className="text-xl">🙌</span>
                <p className="text-xs mt-2">No hay paradas pendientes para hoy.</p>
              </div>
            ) : (
              pedidos.filter((p: any) => p.estado === "pendiente" || p.estado === "en_ruta").slice(0, 5).map((pedido: any, idx: number) => (
                <li key={pedido.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.01] transition-colors">
                  <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold border ${
                    pedido.estado === "en_ruta" 
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-zinc-200">{pedido.nombreCliente}</div>
                    <div className="truncate text-xs text-zinc-500">{pedido.direccion}</div>
                  </div>
                  <div className="text-xs font-mono text-zinc-500">
                    {pedido.horarioPreferido || "AM/PM"}
                  </div>
                </li>
              ))
            )}
          </ol>
        </div>

      </div>

      {/* Monitoreo: despachos en curso. La creación de pedidos vive en la pestaña Pedidos. */}
      <div className="pt-2">

        {/* Listado de Pedidos Recientes */}
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-3xl shadow-xl overflow-hidden flex flex-col hover:border-zinc-750 transition-all duration-300">
          <div className="px-8 py-5 border-b border-white/[0.04] flex justify-between items-center bg-zinc-950/20">
            <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-300">
              Despachos en Curso <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full ml-2 text-xs">{pedidos.length}</span>
            </h2>
          </div>
          
          <div className="overflow-y-auto max-h-[480px] p-6 lg:p-8 flex flex-col gap-4 bg-zinc-950/10">
            {pedidos.length === 0 ? (
              <div className="text-center flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 mb-4 rounded-full bg-zinc-900/50 flex items-center justify-center border border-white/[0.04]">
                  <span className="text-2xl">📦</span>
                </div>
                <h3 className="text-zinc-300 font-semibold text-lg mb-1">Cero despachos activos</h3>
                <p className="text-zinc-500 text-sm max-w-sm">Tu bandeja de despachos de hoy está vacía. Crea el primer pedido para iniciar la ruta.</p>
              </div>
            ) : (
              pedidos.map((pedido: any) => (
                <FilaPedido key={pedido.id} pedido={pedido} />
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
