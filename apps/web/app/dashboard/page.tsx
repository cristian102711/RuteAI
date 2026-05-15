import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { 
  Sparkles, Package, CircleCheck, TriangleAlert, Truck 
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true },
  });

  if (!usuarioDB || !usuarioDB.empresa) {
    redirect("/login");
  }

  const empresaId = usuarioDB.empresa.id;

  const pedidos = await prisma.pedido.findMany({
    where: { empresaId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const total = pedidos.length;
  const entregados = pedidos.filter((p) => p.estado === "entregado").length;
  const fallidos = pedidos.filter((p) => p.estado === "fallido").length;
  
  const repartidores = await prisma.usuario.findMany({
    where: { empresaId, rol: "repartidor" }
  });

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto text-zinc-100 selection:bg-amber-500/30">
      
      {/* Header de la página */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-500 font-bold">
            Operación · Hoy
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
            {usuarioDB.empresa.nombre} · Global
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {new Date().toLocaleDateString("es-CO", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {repartidores.length} repartidores asignados a {total} paradas
          </p>
        </div>
        <button className="hidden items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-400 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] sm:inline-flex transition-transform hover:scale-105 active:scale-95">
          <Sparkles className="h-4 w-4" />
          Sugerencias IA
        </button>
      </div>

      {/* Grid de 4 KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-white/5 p-5 hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
              <Package className="h-3.5 w-3.5 text-zinc-500" /> Pedidos del día
            </div>
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">{total}</div>
          <div className="mt-1 text-xs text-zinc-500">+12 vs ayer</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-white/5 p-5 hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
              <CircleCheck className="h-3.5 w-3.5 text-emerald-500" /> Entregados
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">{entregados}</div>
          <div className="mt-1 text-xs text-zinc-500">{total > 0 ? Math.round((entregados/total)*100) : 0}% de avance</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-white/5 p-5 hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
              <TriangleAlert className="h-3.5 w-3.5 text-red-500" /> Fallidos
            </div>
            {fallidos > 0 && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">{fallidos}</div>
          <div className="mt-1 text-xs text-zinc-500">
            {fallidos > 0 ? "dirección incorrecta" : "todo en orden"}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-white/5 p-5 hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
              <Truck className="h-3.5 w-3.5 text-blue-400" /> Repartidores activos
            </div>
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">{repartidores.length}</div>
          <div className="mt-1 text-xs text-zinc-500">{repartidores.length} en ruta ahora</div>
        </div>
      </div>

      {/* Grid Central: Gráfico y Sugerencia IA */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Gráfico Semanal (HTML a Tailwind equivalente) */}
        <div className="rounded-xl border border-zinc-800 bg-white/5 p-5 lg:col-span-2 hover:bg-white/[0.06] transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Entregas exitosas vs fallidas · semana</h3>
              <p className="text-xs text-zinc-500">Últimos 7 días</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              96.4% éxito
            </span>
          </div>
          
          <div className="mt-6 flex h-56 items-end gap-3">
            {[
              { day: "Vie", h1: "12px", h2: "114px" },
              { day: "Sáb", h1: "9px",  h2: "156px" },
              { day: "Dom", h1: "3px",  h2: "62px" },
              { day: "Lun", h1: "15px", h2: "132px" },
              { day: "Mar", h1: "6px",  h2: "147px" },
              { day: "Mié", h1: "12px", h2: "153px" },
              { day: "Jue", h1: "3px",  h2: "126px" }
            ].map((bar, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2 group cursor-pointer">
                <div className="flex w-full flex-col items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <div className="w-full rounded-sm bg-red-500/70 transition-all group-hover:scale-105" style={{ height: bar.h1 }} />
                  <div className="w-full rounded-sm bg-gradient-to-t from-amber-500 to-amber-300 transition-all group-hover:scale-105" style={{ height: bar.h2 }} />
                </div>
                <div className="text-[11px] text-zinc-500 group-hover:text-white transition-colors">{bar.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sugerencia IA Widget */}
        <div className="rounded-xl border border-zinc-800 bg-white/5 p-5 flex flex-col justify-between hover:bg-white/[0.06] transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Sugerencia IA</h3>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-4 rounded-lg border border-purple-500/30 bg-purple-500/10 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="relative z-10">
              <div className="text-xs uppercase tracking-wider text-purple-400 font-bold">Re-ruteo recomendado</div>
              <p className="mt-2 text-sm text-zinc-300">
                Reasignar 3 paradas de <b className="text-white">Diego Morales</b> a <b className="text-white">Camila Ríos</b> ahorra
                <span className="mx-1 font-mono text-amber-400 font-bold">+22 min</span> y
                <span className="ml-1 font-mono text-amber-400 font-bold">−1.8 L</span>.
              </p>
              <button className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-purple-500 to-purple-400 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:scale-105 transition-transform active:scale-95">
                Aplicar cambio
              </button>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-xs text-zinc-500">
            <div className="flex justify-between"><span>Modelo</span><span className="font-mono text-white">gpt-logistics-v2.1</span></div>
            <div className="flex justify-between"><span>Confianza</span><span className="font-mono text-emerald-400 font-bold">92%</span></div>
          </div>
        </div>
      </div>

      {/* Grid Final: Mapa y Lista de Paradas */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Actividad en Vivo (Mapa estático replicado en CSS para exactitud) */}
        <div className="rounded-xl border border-zinc-800 bg-white/5 lg:col-span-2 flex flex-col overflow-hidden">
          <div className="border-b border-zinc-800 px-5 py-4 bg-zinc-950/50">
            <h3 className="text-sm font-semibold text-white flex items-center justify-between">
              Actividad en vivo
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-xs text-zinc-500">Mapa de la operación de hoy</p>
          </div>
          <div className="relative flex-1 overflow-hidden bg-zinc-950 min-h-[300px]">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
            <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
            
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-30">
              <path d="M0,82 L100,82" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
              <path d="M0,46 L100,46" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
              <path d="M22,0 L22,100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
              <path d="M58,0 L58,100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
              <path d="M84,0 L84,100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
            </svg>

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <defs>
                <linearGradient id="routeGradSmall" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <path d="M12,78 C20,68 22,62 26,58 S36,72 40,70 S52,48 55,44 S64,58 68,60 S78,38 82,32 S88,22 90,18" fill="none" stroke="url(#routeGradSmall)" strokeWidth="0.7" opacity="0.7" />
              <path d="M12,78 C20,68 22,62 26,58 S36,72 40,70 S52,48 55,44 S64,58 68,60 S78,38 82,32 S88,22 90,18" fill="none" stroke="url(#routeGradSmall)" strokeWidth="0.4" strokeDasharray="1.5 1.2" />
              <circle r="0.9" fill="#f59e0b">
                <animateMotion dur="6s" repeatCount="indefinite" path="M12,78 C20,68 22,62 26,58 S36,72 40,70 S52,48 55,44 S64,58 68,60 S78,38 82,32 S88,22 90,18" />
              </circle>
            </svg>

            {[
              { left: "12%", top: "78%", name: "Depósito", color: "bg-amber-500", ring: "ring-amber-500/30" },
              { left: "26%", top: "58%", name: "Castillo", color: "bg-purple-500", ring: "ring-purple-500/30" },
              { left: "40%", top: "70%", name: "Quintero", color: "bg-white", ring: "ring-white/20" },
              { left: "55%", top: "44%", name: "Hernández", color: "bg-white", ring: "ring-white/20" },
              { left: "68%", top: "60%", name: "Mendoza", color: "bg-white", ring: "ring-white/20" },
              { left: "82%", top: "32%", name: "Ortiz", color: "bg-white", ring: "ring-white/20" },
              { left: "90%", top: "18%", name: "Vega", color: "bg-white", ring: "ring-white/20" },
            ].map((pt, i) => (
              <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pt.left, top: pt.top }}>
                <div className={`relative h-2.5 w-2.5 rounded-full ring-2 ${pt.color} ${pt.ring}`}>
                  <span className={`absolute inset-0 rounded-full animate-ping opacity-60 ${pt.color}`} />
                </div>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-zinc-950/90 px-1 py-0.5 text-[9px] font-medium text-white ring-1 ring-white/10 backdrop-blur">
                  {pt.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista Próximas Paradas */}
        <div className="rounded-xl border border-zinc-800 bg-white/5 flex flex-col">
          <div className="border-b border-zinc-800 px-5 py-4 bg-zinc-950/50">
            <h3 className="text-sm font-semibold text-white">Próximas paradas</h3>
            <p className="text-xs text-zinc-500">Ruta de Camila Ríos</p>
          </div>
          <ol className="divide-y divide-zinc-800">
            {[
              { num: 1, name: "María Fernanda Castillo", addr: "Av. Insurgentes Sur 1602", time: "10:42", st: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" },
              { num: 2, name: "Andrés Quintero", addr: "Cra. 13 #93-40", time: "11:08", st: "bg-amber-500/20 text-amber-400 ring-amber-500/40" },
              { num: 3, name: "Sofía Hernández", addr: "Av. Santa Fe 1234", time: "11:34", st: "bg-white/5 text-zinc-400 ring-white/10" },
              { num: 4, name: "Carlos Mendoza", addr: "Av. Javier Prado Este 4200", time: "12:01", st: "bg-white/5 text-zinc-400 ring-white/10" },
              { num: 5, name: "Valentina Ortiz", addr: "Av. Providencia 2594", time: "12:28", st: "bg-white/5 text-zinc-400 ring-white/10" },
            ].map((p) => (
              <li key={p.num} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ring-1 ring-inset ${p.st}`}>
                  {p.num}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-200">{p.name}</div>
                  <div className="truncate text-xs text-zinc-500">{p.addr}</div>
                </div>
                <div className="text-xs font-mono text-zinc-500">{p.time}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
