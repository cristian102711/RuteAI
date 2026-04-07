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
  // Usamos include para traer de inmediato los datos de la Empresa asociada
  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true }
  });
  if (!usuarioDB || !usuarioDB.empresa) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-zinc-950 p-6 text-white font-sans">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500" />
          
          <h1 className="text-2xl font-bold mb-2">¡Bienvenido a <span className="text-emerald-400">RouteAI</span>! 🎉</h1>
          <p className="text-zinc-400 mb-8 text-sm">
            Para comenzar a operar, necesitamos el nombre de tu empresa. Todos los datos logísticos estarán protegidos de forma segura bajo este perfil y serás el Administrador Principal.
          </p>
          
          {/* El formulario ejecuta la Action que creamos y refresca la página automáticamente */}
          <form action={crearEmpresaYUsuario} className="flex flex-col gap-4">
            
            {/* Estos inputs están ocultos, le envían el correo y el ID interno directo a Prisma */}
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="userEmail" value={user.email || ""} />
            
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                Nombre de tu Empresa / Flota
              </label>
              <input 
                name="nombreEmpresa" 
                placeholder="Ej: Awna Logistics SPA" 
                required
                className="w-full bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              />
            </div>

            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 mt-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
              Crear Empresa y Continuar
            </button>
          </form>
          
        </div>
      </div>
    );
  }

  // 3. Ahora sí, traemos los pedidos SOLO de tu empresa (Multi-Tenant Real)
  const empresaActiva = usuarioDB.empresa;
  const pedidos = await prisma.pedido.findMany({
    where: { empresaId: empresaActiva.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabecera del Panel */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">
              Operaciones: <span className="text-emerald-400">{empresaActiva.nombre}</span>
            </h1>
            <p className="text-zinc-500">Gestión logística y predicción de riesgo RouteAI.</p>
          </div>
        </header>

        {/* Zona del Formulario y las Estadísticas Rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          
          <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit">
            <h2 className="text-lg font-semibold mb-4 text-emerald-400">Despachar Nuevo Pedido</h2>
            
            {/* AQUÍ INYECTAMOS NUESTRO COMPONENTE DE CLIENTE (UX) */}
            <FormCrearPedido empresaId={empresaActiva.id} />

          </div>

          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h2 className="text-lg font-semibold text-zinc-100">Despachos en Curso ({pedidos.length})</h2>
            </div>
            
            <div className="overflow-y-auto max-h-[400px] p-6 flex flex-col gap-3">
              {pedidos.length === 0 ? (
                <div className="text-center text-zinc-500 py-10">Sin despachos hoy. ¡Crea el primero!</div>
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
