import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Package, Search, Calendar, Filter } from "lucide-react";
import { FilaPedido } from "../components/FilaPedido";

export default async function PedidosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true }
  });
  
  if (!usuarioDB || !usuarioDB.empresa) redirect("/dashboard");

  // Obtener absolutamente todos los pedidos de la empresa para el historial
  const todosLosPedidos = await prisma.pedido.findMany({
    where: { empresaId: usuarioDB.empresa.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="font-sans px-2">
      <div className="max-w-[85rem] mx-auto">
        <header className="mb-10 lg:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800/50 pb-6">
          <div className="flex flex-col gap-1">
            <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-1 flex items-center gap-2">
               <Package className="w-4 h-4" />
               Historial Logístico
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
              Todos los <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Pedidos</span>
            </h1>
            <p className="text-zinc-500/90 text-sm md:text-base max-w-xl">
              Visualiza y administra el historial completo de envíos.
            </p>
          </div>
          
          <div className="mt-6 md:mt-0 flex items-center gap-3 w-full md:w-auto">
             <div className="relative group flex-1 md:flex-none">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-amber-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Buscar manifiesto..." 
                  className="w-full md:w-64 bg-zinc-950/80 border border-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 shadow-inner transition-all text-sm"
                />
             </div>
             <button className="p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all shadow-sm">
                <Filter className="w-4 h-4" />
             </button>
             <button className="p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all shadow-sm">
                <Calendar className="w-4 h-4" />
             </button>
          </div>
        </header>

        <section className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 shadow-xl min-h-[500px]">
          {todosLosPedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
               <Package className="w-12 h-12 mb-4 opacity-50" />
               <p>No hay registro de envíos procesados o pendientes.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {todosLosPedidos.map((pedido) => (
                <FilaPedido key={pedido.id} pedido={pedido} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
