import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Package, Truck, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export default async function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id) redirect("/404");

  // Buscar el pedido (Al ser público, no verificamos usuario, es una URL "secreta")
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      empresa: {
        select: { nombre: true } // Ocultar datos privados, solo enviar el nombre.
      }
    }
  });

  if (!pedido) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-6 text-white font-sans text-center">
         <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
         <h1 className="text-2xl font-bold mb-2">Pedido no encontrado</h1>
         <p className="text-zinc-500">El link que ingresaste no es válido o ha expirado.</p>
      </div>
    );
  }

  // Lógica simple para renderizar UI de avance
  const hitos = [
    { key: "pendiente", label: "Preparando", icon: Package },
    { key: "en_ruta", label: "En Camino", icon: Truck },
    { key: "entregado", label: "Entregado", icon: CheckCircle2 }
  ];

  const estadoIndex = hitos.findIndex(h => h.key === pedido.estado) !== -1 
      ? hitos.findIndex(h => h.key === pedido.estado) 
      : 0; // Default a pendiente si hay algun error.

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-emerald-500/30">
      
      {/* HEADER PÚBLICO (Adaptado para Móvil por Default) */}
      <header className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800/60 p-6 sticky top-0 z-50">
         <div className="max-w-md mx-auto flex items-center justify-between">
           <div>
             <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mb-0.5">Operado por</p>
             <h2 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400">
               {pedido.empresa.nombre}
             </h2>
           </div>
           {pedido.estado === "en_ruta" && (
             <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full shadow-inner">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Live</span>
             </div>
           )}
         </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-md mx-auto p-6 relative">
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none opacity-50" />
        
        {/* INFO DEL PEDIDO */}
        <section className="relative z-10 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-8 shadow-xl mt-4">
           <h1 className="text-2xl font-extrabold mb-1">¡Hola, {pedido.nombreCliente.split(" ")[0]}! 👋</h1>
           <p className="text-sm text-zinc-400 font-medium mb-6 leading-relaxed">
             Aquí puedes monitorear en tiempo real el avance de tu entrega.
           </p>

           <div className="flex flex-col gap-5 border-t border-zinc-800/50 pt-6">
             <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50 flex-shrink-0">
                 <Package className="w-5 h-5 text-zinc-300" />
               </div>
               <div>
                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Contenido del Transporte</p>
                 <p className="font-bold text-zinc-200 mt-0.5 uppercase tracking-wide">{pedido.producto}</p>
               </div>
             </div>

             <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50 flex-shrink-0">
                 <Clock className="w-5 h-5 text-blue-400" />
               </div>
               <div>
                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Ventana de Entrega Solicitada</p>
                 <p className="font-bold text-blue-400 mt-0.5">{pedido.horarioPreferido || "Durante el día"}</p>
               </div>
             </div>
           </div>
        </section>

        {/* TIMELINE DE PROGRESO */}
        <section className="relative z-10 mt-8 mb-10 px-2">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Estado de la ruta</h3>
            
            <div className="flex flex-col gap-0 relative">
              <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-zinc-800/80 z-0"></div>
              
              {hitos.map((hito, i) => {
                const isCompleted = i < estadoIndex;
                const isCurrent = i === estadoIndex;
                const Icon = hito.icon;

                return (
                  <div key={hito.key} className="flex gap-5 relative z-10 mb-8 last:mb-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      isCompleted 
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]" 
                        : isCurrent
                          ? "bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse"
                          : "bg-zinc-950 border-zinc-800 text-zinc-600"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                     <div className="flex flex-col pt-2.5">
                       <h4 className={`font-bold text-sm leading-none ${isCurrent ? "text-zinc-100" : isCompleted ? "text-emerald-400" : "text-zinc-500"}`}>
                         {hito.label}
                       </h4>
                       {isCurrent && hito.key === "en_ruta" && (
                         <p className="text-xs text-blue-400 mt-1.5 font-medium">El repartidor se dirige a tu domicilio.</p>
                       )}
                       {isCurrent && hito.key === "pendiente" && (
                         <p className="text-xs text-zinc-400 mt-1.5 font-medium">Empaquetando en bodega.</p>
                       )}
                     </div>
                  </div>
                )
              })}
            </div>
        </section>

      </main>
    </div>
  );
}
