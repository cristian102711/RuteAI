import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Map, Truck, Navigation, ChevronRight, CheckCircle2 } from "lucide-react";

export default async function RutasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true }
  });
  
  if (!usuarioDB || !usuarioDB.empresa) redirect("/dashboard");
  const empresaActiva = usuarioDB.empresa;

  // Obtener pedidos pendientes para la ruta del día
  const pedidosPendientes = await prisma.pedido.findMany({
    where: { 
      empresaId: empresaActiva.id,
      estado: "pendiente"
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="font-sans px-2">
      <div className="max-w-[85rem] mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800/50 pb-6">
          <div className="flex flex-col gap-1">
            <span className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-1 flex items-center gap-2">
               <Navigation className="w-4 h-4" />
               Logística y Desplazamiento
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
              Rutas <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Inteligentes</span>
            </h1>
            <p className="text-zinc-500/90 text-sm md:text-base max-w-xl">
              Optimización de trayectos usando Google Maps / Motor de Enrutamiento para minimizar la huella y tiempo.
            </p>
          </div>
          <button className="mt-6 md:mt-0 px-6 py-3.5 bg-blue-500 hover:bg-blue-400 text-zinc-950 font-extrabold rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all active:scale-95 flex items-center gap-2">
            <Map className="w-5 h-5" /> Calcular Ruta Óptima
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Orden de Despacho (Sidebar de Ruta) */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-bold tracking-widest uppercase mb-6 text-zinc-300 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Manifiesto de Ruta ({pedidosPendientes.length})
              </h2>

              <div className="flex flex-col gap-0 relative">
                {/* Línea vertical de conexión en el UI */}
                <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-zinc-800/80 z-0"></div>

                {pedidosPendientes.length === 0 ? (
                  <p className="text-zinc-500 text-sm z-10 bg-zinc-900 py-2">No hay despachos pendientes.</p>
                ) : (
                  pedidosPendientes.map((pedido, index) => (
                    <div key={pedido.id} className="flex gap-4 relative z-10 group mb-6 last:mb-0">
                       <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-950 border-2 border-blue-500/50 flex items-center justify-center text-xs font-bold text-blue-400 group-hover:bg-blue-500 group-hover:text-zinc-950 transition-colors shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                         {index + 1}
                       </div>
                       <div className="flex flex-col pt-1">
                         <h4 className="text-zinc-100 font-bold text-sm leading-none">{pedido.direccion}</h4>
                         <p className="text-zinc-500 text-xs mt-1 font-medium">{pedido.nombreCliente} • <span className="uppercase text-zinc-600">{pedido.producto}</span></p>
                       </div>
                    </div>
                  ))
                )}
                
                {pedidosPendientes.length > 0 && (
                  <div className="flex gap-4 relative z-10 mt-6">
                     <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-950 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                       <CheckCircle2 className="w-5 h-5" />
                     </div>
                     <div className="flex flex-col pt-1.5">
                       <h4 className="text-emerald-400 font-bold text-sm leading-none">Fin del Recorrido</h4>
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mapa Visual (Mockup API) */}
          <div className="lg:col-span-2 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl overflow-hidden shadow-xl min-h-[500px] relative group h-full">
            <div className="absolute inset-0 bg-zinc-950 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-screen pointer-events-none" />
            
            {/* UI Placeholder del mapa real */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
               <div className="w-24 h-24 mb-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.15)] relative">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 animate-ping absolute inset-0 m-auto"></div>
                  <Map className="w-10 h-10 text-blue-400 relative z-10" />
               </div>
               <h3 className="text-2xl font-bold text-zinc-100 mb-2">Visor de Rutas Desactivado</h3>
               <p className="text-zinc-400 max-w-md">Para activar el enrutamiento interactivo es necesario inyectar la Key de <b>Google Maps Directions API</b> o <b>Mapbox</b> en las variables de entorno.</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
