import prisma from "@/lib/prisma";
import { FormCrearPedido } from "./components/FormCrearPedido";
import { FilaPedido } from "./components/FilaPedido";
import {createClient} from "@/lib/supabaseServer";
import { crearEmpresaYUsuario } from "./actions";

// Este es el Centro de Operaciones. Un Server Component seguro.
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
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-blue-500" />
          
          {/* Luz de fondo sutil (Glow) */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-[50px] group-hover:bg-emerald-500/20 transition-all duration-700" />

          <h1 className="text-3xl font-extrabold mb-3 tracking-tight">¡Bienvenido a <span className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">RouteAI</span>! 🎉</h1>
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
                className="w-full bg-zinc-950/80 border border-zinc-800 text-white placeholder-zinc-700 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 shadow-inner transition-all font-medium text-sm"
              />
            </div>

            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] text-zinc-950 font-extrabold py-4 mt-2 rounded-2xl transition-all duration-300 active:scale-95 tracking-wide">
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

  return (
    <div className="font-sans px-2">
      <div className="max-w-[85rem] mx-auto">
        
        {/* Cabecera del Panel */}
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border-ui pb-8 relative">
          <div className="flex flex-col gap-1 relative z-10">
            <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-[0.3em] uppercase mb-3 flex items-center gap-3">
               <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse"></span>
               Operativa Global Inteligente
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground mb-2 leading-none">
              Panel de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 dark:from-emerald-400 via-emerald-500 to-blue-600 dark:to-emerald-500">{empresaActiva.nombre}</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-lg max-w-2xl font-medium leading-relaxed">
              Gestión logística de última milla con <span className="text-zinc-900 dark:text-zinc-100">predicción de riesgo basada en IA</span> y monitoreo satelital en tiempo real.
            </p>
          </div>
          
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        </header>

        {/* Zona del Formulario y las Estadísticas Rápidas */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
          
          <div className="xl:col-span-1 bg-card-bg backdrop-blur-2xl border border-border-ui rounded-[2rem] p-8 shadow-xl dark:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-700 h-fit hover:border-emerald-500/20 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <h2 className="text-[11px] font-black tracking-[0.2em] uppercase mb-8 text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
              Nuevo Despacho
            </h2>
            
            <FormCrearPedido empresaId={empresaActiva.id} />
          </div>

          <div className="xl:col-span-2 bg-card-bg backdrop-blur-2xl border border-border-ui rounded-[2rem] shadow-2xl overflow-hidden flex flex-col hover:border-emerald-500/20 transition-all duration-700 relative">
            <div className="px-8 py-7 border-b border-border-ui flex justify-between items-center bg-background/40">
              <h2 className="text-sm font-black tracking-[0.15em] uppercase text-foreground flex items-center">
                Despachos en Curso 
                <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full ml-4 text-[10px] shadow-sm font-black">
                  {pedidos.length}
                </span>
              </h2>
              <div className="flex gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
                 <div className="w-1.5 h-1.5 rounded-full bg-border-ui"></div>
                 <div className="w-1.5 h-1.5 rounded-full bg-border-ui"></div>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[550px] p-8 lg:p-10 flex flex-col gap-6 bg-background/20">
              {pedidos.length === 0 ? (
                <div className="text-center flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-20 h-20 mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
                     <span className="text-3xl">📦</span>
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
    </div>
  );
}
