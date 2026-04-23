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
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800/50 pb-6">
          <div className="flex flex-col gap-1">
            <span className="text-emerald-400/80 text-sm font-semibold tracking-widest uppercase mb-1 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               Operativa Global
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
              Panel de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">{empresaActiva.nombre}</span>
            </h1>
            <p className="text-zinc-500/90 text-sm md:text-base max-w-xl">
              Gestión logística inteligente y predicción de riesgo en vivo por RouteAI.
            </p>
          </div>
        </header>

        {/* Zona del Formulario y las Estadísticas Rápidas */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
          
          <div className="xl:col-span-1 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-7 shadow-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-500 h-fit hover:border-zinc-700/50 group block">
            <h2 className="text-sm font-bold tracking-widest uppercase mb-6 text-emerald-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-70 group-hover:opacity-100 transition-opacity"></span>
              Nuevo Despacho
            </h2>
            
            <FormCrearPedido empresaId={empresaActiva.id} />
          </div>

          <div className="xl:col-span-2 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl shadow-xl overflow-hidden flex flex-col hover:border-zinc-700/50 transition-all duration-500">
            <div className="px-8 py-6 border-b border-zinc-800/60 flex justify-between items-center bg-zinc-950/20">
              <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-300">
                Despachos en Curso <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full ml-2 text-xs">{pedidos.length}</span>
              </h2>
            </div>
            
            <div className="overflow-y-auto max-h-[480px] p-6 lg:p-8 flex flex-col gap-4 bg-zinc-950/10">
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
