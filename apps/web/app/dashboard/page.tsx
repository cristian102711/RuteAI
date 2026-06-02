import prisma from "@ruteai/database";
import { FormCrearPedido } from "./components/FormCrearPedido";
import { FilaPedido } from "./components/FilaPedido";
import { createClient } from "@/lib/supabaseServer";
import { crearEmpresaYUsuario } from "./actions";
import { 
  Package, CheckSquare, Users, AlertTriangle, 
  Sparkles, ArrowRight, Zap, Route
} from "lucide-react";

// Server component para la gestión de RouteAI Dashboard
export default async function DashboardPage() {
  
  // 1. Obtener al usuario real que inició sesión desde Supabase Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div className="p-10 text-xl font-bold text-red-400 bg-zinc-950 h-screen">🚨 Error: Sesión no válida.</div>;
  }

  // 2. Buscar en nuestra tabla 'Usuario' de Prisma usando el ID de Supabase
  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true }
  });
  
  if (!usuarioDB || !usuarioDB.empresa) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-white font-sans">
        <div className="max-w-md w-full bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-amber-600 to-purple-600" />
          
          {/* Luz de fondo sutil (Glow) */}
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
                className="w-full bg-zinc-950/80 border border-zinc-800 text-white placeholder-zinc-700 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 shadow-inner transition-all font-medium text-sm"
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

  // 3. Multi-Tenant Real
  const empresaActiva = usuarioDB.empresa;
  const pedidos = await prisma.pedido.findMany({
    where: { empresaId: empresaActiva.id },
    orderBy: { createdAt: "desc" },
  });

  const conductoresTotales = await prisma.usuario.count({
    where: { empresaId: empresaActiva.id, rol: "repartidor" }
  });

  const alertasPendientes = await prisma.alerta.count({
    where: { empresaId: empresaActiva.id, leida: false }
  });

  // KPIs dinámicos calculados o simulados con buen fallback
  const pedidosDelDia = pedidos.length || 47;
  const entregados = pedidos.filter(p => p.estado === "entregado").length || 30;
  const fallidos = pedidos.filter(p => p.estado === "fallido").length || 1;
  const repartidoresActivos = conductoresTotales || 3;
  const avancePorcentaje = Math.round((entregados / pedidosDelDia) * 100) || 64;

  // Fecha bonita en español
  const hoyFormatted = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  const hoyCapitalized = hoyFormatted.charAt(0).toUpperCase() + hoyFormatted.slice(1);

  return (
    <div className="space-y-6 text-white">
      {/* Título Superior */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-amber-500">Operación · Hoy</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
            {empresaActiva.nombre} · Bogotá
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {hoyCapitalized} · {repartidoresActivos} repartidores asignados a {pedidosDelDia} paradas
          </p>
        </div>
        
        <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(167,139,250,0.2)] hover:opacity-90 transition active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, hsl(271 81% 66%), hsl(300 74% 40%))" }}>
          <Sparkles className="h-4 w-4" />
          Sugerencias IA
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Pedidos del día */}
        <div className="rounded-xl border border-zinc-800/80 bg-white/[0.02] p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <Package className="h-3.5 w-3.5 text-amber-500" />
              Pedidos del día
            </div>
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">{pedidosDelDia}</div>
          <div className="mt-1 text-xs text-zinc-500">+12 vs ayer</div>
        </div>

        {/* Card 2: Entregados */}
        <div className="rounded-xl border border-zinc-800/80 bg-white/[0.02] p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
              Entregados
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">{entregados}</div>
          <div className="mt-1 text-xs text-zinc-500">{avancePorcentaje}% de avance</div>
        </div>

        {/* Card 3: Fallidos */}
        <div className="rounded-xl border border-zinc-800/80 bg-white/[0.02] p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
              Fallidos
            </div>
            {fallidos > 0 && <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">{fallidos}</div>
          <div className="mt-1 text-xs text-zinc-500">{fallidos === 1 ? "dirección incorrecta" : `${fallidos} incidentes`}</div>
        </div>

        {/* Card 4: Repartidores activos */}
        <div className="rounded-xl border border-zinc-800/80 bg-white/[0.02] p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <Users className="h-3.5 w-3.5 text-purple-400" />
              Repartidores activos
            </div>
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">{repartidoresActivos}</div>
          <div className="mt-1 text-xs text-zinc-500">{repartidoresActivos} en ruta ahora</div>
        </div>

      </div>

      {/* Grid del medio: Reporte y Sugerencia IA */}
      <div className="grid gap-4 lg:grid-cols-3">
        
        {/* Gráfico de barras de la semana */}
        <div className="rounded-xl border border-zinc-800/80 bg-white/[0.02] p-5 lg:col-span-2 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Entregas exitosas vs fallidas · semana</h3>
              <p className="text-xs text-zinc-500">Últimos 7 días</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              96.4% éxito
            </span>
          </div>

          <div className="mt-6 flex h-56 items-end gap-3 px-2">
            {[
              { day: "Vie", val: 114, failed: 12 },
              { day: "Sáb", val: 156, failed: 9 },
              { day: "Dom", val: 63, failed: 3 },
              { day: "Lun", val: 132, failed: 15 },
              { day: "Mar", val: 147, failed: 6 },
              { day: "Mié", val: 153, failed: 12 },
              { day: "Jue", val: 126, failed: 3 },
            ].map((d, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-col items-center gap-1">
                  {/* Barra fallidos */}
                  <div className="w-full rounded-sm bg-rose-500/40" style={{ height: `${d.failed}px` }} />
                  {/* Barra exitosos */}
                  <div className="w-full rounded-sm bg-gradient-to-t from-amber-500 to-yellow-400" style={{ height: `${d.val}px` }} />
                </div>
                <div className="text-[11px] text-zinc-500 font-medium">{d.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sugerencias de IA */}
        <div className="rounded-xl border border-zinc-800/80 bg-white/[0.02] p-5 shadow-lg backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-100">Sugerencia IA</h3>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>

          <div className="mt-4 rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Re-ruteo recomendado</div>
            <p className="mt-2 text-sm text-zinc-200 leading-relaxed">
              Reasignar 3 paradas de <b className="text-zinc-100">Diego Morales</b> a <b className="text-zinc-100">Camila Ríos</b> ahorra
              <span className="mx-1 font-mono text-amber-400 font-bold">+22 min</span> y
              <span className="ml-1 font-mono text-amber-400 font-bold">−1.8 L</span>.
            </p>
            <button className="mt-4 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-md active:scale-95 transition"
              style={{ background: "linear-gradient(to right, hsl(271 81% 66%), hsl(300 74% 40%))" }}>
              Aplicar 
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="mt-4 space-y-2 border-t border-zinc-850 pt-3 text-xs text-zinc-500">
            <div className="flex justify-between">
              <span>Modelo</span>
              <span className="font-mono text-zinc-300">gpt-logistics-v2.1</span>
            </div>
            <div className="flex justify-between">
              <span>Confianza</span>
              <span className="font-mono text-zinc-300">92%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Grid inferior: Mapa y paradas */}
      <div className="grid gap-4 lg:grid-cols-3">
        
        {/* Actividad en vivo con mapa animado */}
        <div className="rounded-xl border border-zinc-800/80 bg-white/[0.02] lg:col-span-2 shadow-lg backdrop-blur-xl">
          <div className="border-b border-zinc-850 px-5 py-4">
            <h3 className="text-sm font-semibold text-zinc-100">Actividad en vivo</h3>
            <p className="text-xs text-zinc-500">Mapa de la operación de hoy</p>
          </div>

          <div className="relative overflow-hidden rounded-2xl m-5 aspect-[16/9] bg-zinc-950/80 border border-zinc-850">
            
            {/* Grilla técnica en CSS */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {/* Efectos de luces radiales */}
            <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-purple-500/10 blur-[80px]" />
            <div className="absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-amber-500/10 blur-[95px]" />

            {/* Líneas estáticas de fondo */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-20">
              <path d="M0,82 L100,82" stroke="white" strokeWidth="0.2" />
              <path d="M0,46 L100,46" stroke="white" strokeWidth="0.2" />
              <path d="M22,0 L22,100" stroke="white" strokeWidth="0.2" />
              <path d="M58,0 L58,100" stroke="white" strokeWidth="0.2" />
              <path d="M84,0 L84,100" stroke="white" strokeWidth="0.2" />
            </svg>

            {/* SVG Ruta animada */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <defs>
                <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="0.8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path 
                d="M12,78 C20,68 22,62 26,58 S36,72 40,70 S52,48 55,44 S64,58 68,60 S78,38 82,32 S88,22 90,18" 
                fill="none" 
                stroke="url(#routeGrad)" 
                strokeWidth="0.6" 
                filter="url(#glow)" 
                opacity="0.8" 
              />
              <path 
                d="M12,78 C20,68 22,62 26,58 S36,72 40,70 S52,48 55,44 S64,58 68,60 S78,38 82,32 S88,22 90,18" 
                fill="none" 
                stroke="url(#routeGrad)" 
                strokeWidth="0.4" 
                strokeDasharray="1.2 1" 
              />
              {/* Círculo animado que viaja por la ruta */}
              <circle r="1" fill="#f59e0b" filter="url(#glow)">
                <animateMotion dur="8s" repeatCount="indefinite" path="M12,78 C20,68 22,62 26,58 S36,72 40,70 S52,48 55,44 S64,58 68,60 S78,38 82,32 S88,22 90,18" />
              </circle>
            </svg>

            {/* Puntos y etiquetas flotantes en el mapa */}
            {[
              { name: "Depósito", x: "12%", y: "78%", color: "#f59e0b" },
              { name: "Castillo", x: "26%", y: "58%", color: "#a78bfa" },
              { name: "Quintero", x: "40%", y: "70%", color: "#ffffff" },
              { name: "Hernández", x: "55%", y: "44%", color: "#ffffff" },
              { name: "Mendoza", x: "68%", y: "60%", color: "#ffffff" },
              { name: "Ortiz", x: "82%", y: "32%", color: "#ffffff" },
              { name: "Vega", x: "90%", y: "18%", color: "#ffffff" },
            ].map((pt, idx) => (
              <div key={idx} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pt.x, top: pt.y }}>
                <div className="relative h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pt.color, boxShadow: `0 0 0 2px ${pt.color}40` }}>
                  <span className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ backgroundColor: pt.color }} />
                </div>
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-zinc-950/80 px-1.5 py-0.5 text-[9px] font-medium text-zinc-300 border border-zinc-800 backdrop-blur">
                  {pt.name}
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* Próximas paradas de la ruta */}
        <div className="rounded-xl border border-zinc-800/80 bg-white/[0.02] shadow-lg backdrop-blur-xl flex flex-col">
          <div className="border-b border-zinc-850 px-5 py-4">
            <h3 className="text-sm font-semibold text-zinc-100">Próximas paradas</h3>
            <p className="text-xs text-zinc-500">Ruta de Camila Ríos</p>
          </div>

          <ol className="divide-y divide-zinc-850 flex-1 overflow-y-auto max-h-[380px]">
            {[
              { num: 1, name: "María Fernanda Castillo", address: "Av. Insurgentes Sur 1602", time: "10:42", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
              { num: 2, name: "Andrés Quintero", address: "Cra. 13 #93-40", time: "11:08", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
              { num: 3, name: "Sofía Hernández", address: "Av. Santa Fe 1234", time: "11:34", bg: "bg-white/5 text-zinc-400 border-zinc-800" },
              { num: 4, name: "Carlos Mendoza", address: "Av. Javier Prado Este 4200", time: "12:01", bg: "bg-white/5 text-zinc-400 border-zinc-800" },
              { num: 5, name: "Valentina Ortiz", address: "Av. Providencia 2594", time: "12:28", bg: "bg-white/5 text-zinc-400 border-zinc-800" },
            ].map((stop, idx) => (
              <li key={idx} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.01] transition-colors">
                <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold border ${stop.bg}`}>
                  {stop.num}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-200">{stop.name}</div>
                  <div className="truncate text-xs text-zinc-500">{stop.address}</div>
                </div>
                <div className="text-xs font-mono text-zinc-500">{stop.time}</div>
              </li>
            ))}
          </ol>
        </div>

      </div>

      {/* Zona Funcional Real: Formulario de Creación y Tabla de Pedidos DB */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-2">
        
        {/* Formulario Crear Pedido */}
        <div className="xl:col-span-1 bg-white/[0.02] border border-zinc-800/80 rounded-3xl p-7 shadow-xl hover:border-zinc-700/50 transition-all duration-300 h-fit">
          <h2 className="text-sm font-bold tracking-widest uppercase mb-6 text-amber-500 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Nuevo Despacho
          </h2>
          <FormCrearPedido empresaId={empresaActiva.id} />
        </div>

        {/* Listado de Pedidos Recientes */}
        <div className="xl:col-span-2 bg-white/[0.02] border border-zinc-800/80 rounded-3xl shadow-xl overflow-hidden flex flex-col hover:border-zinc-700/50 transition-all duration-300">
          <div className="px-8 py-5 border-b border-zinc-850 flex justify-between items-center bg-zinc-950/20">
            <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-300">
              Despachos en Curso <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full ml-2 text-xs">{pedidos.length}</span>
            </h2>
          </div>
          
          <div className="overflow-y-auto max-h-[480px] p-6 lg:p-8 flex flex-col gap-4 bg-zinc-950/10">
            {pedidos.length === 0 ? (
              <div className="text-center flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 mb-4 rounded-full bg-zinc-900/50 flex items-center justify-center border border-zinc-800/50">
                  <span className="text-2xl">📦</span>
                </div>
                <h3 className="text-zinc-300 font-semibold text-lg mb-1">Cero despachos activos</h3>
                <p className="text-zinc-500 text-sm max-w-sm">Tu bandeja de despachos de hoy está vacía. Crea el primer pedido para iniciar la ruta.</p>
              </div>
            ) : (
              pedidos.map((pedido) => (
                <FilaPedido key={pedido.id} pedido={pedido} />
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
