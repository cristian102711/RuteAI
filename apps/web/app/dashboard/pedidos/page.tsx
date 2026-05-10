import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Package, Calendar, Filter } from "lucide-react";
import { FilaPedido } from "../components/FilaPedido";
import { BuscadorPedidos } from "../components/BuscadorPedidos";

export default async function PedidosPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string }> 
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { q: searchQuery } = await searchParams;

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true }
  });
  
  if (!usuarioDB || !usuarioDB.empresa) redirect("/dashboard");

  // Obtener pedidos filtrados por búsqueda si existe
  const todosLosPedidos = await prisma.pedido.findMany({
    where: { 
      empresaId: usuarioDB.empresa.id,
      ...(searchQuery ? {
        OR: [
          { nombreCliente: { contains: searchQuery, mode: 'insensitive' } },
          { producto: { contains: searchQuery, mode: 'insensitive' } },
          { direccion: { contains: searchQuery, mode: 'insensitive' } },
          { id: { contains: searchQuery, mode: 'insensitive' } },
        ]
      } : {})
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-2">
      <div className="max-w-[85rem] mx-auto">
        <header className="mb-10 lg:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border-ui pb-8">
          <div className="flex flex-col gap-1.5">
            <span className="text-amber-500 text-xs font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-2">
               <Package className="w-4 h-4" />
               Historial Logístico
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-2">
              Todos los <span className="text-amber-500">Pedidos</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl font-medium">
              Visualiza y administra el historial completo de envíos.
            </p>
          </div>
          
          <div className="mt-6 md:mt-0 flex items-center gap-3 w-full md:w-auto">
              <BuscadorPedidos />
              
             <button className="p-3 bg-card border border-border-ui hover:bg-secondary text-muted-foreground hover:text-foreground rounded-xl transition-all shadow-sm active:scale-95">
                <Filter className="w-4 h-4" />
             </button>
             <button className="p-3 bg-card border border-border-ui hover:bg-secondary text-muted-foreground hover:text-foreground rounded-xl transition-all shadow-sm active:scale-95">
                <Calendar className="w-4 h-4" />
             </button>
          </div>
        </header>

        <section className="bg-card border border-border-ui rounded-3xl p-6 shadow-sm min-h-[500px] hover:shadow-md transition-all duration-300">
          {todosLosPedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
               <div className="w-16 h-16 mb-4 rounded-full bg-secondary flex items-center justify-center border border-border-ui">
                  <Package className="w-8 h-8 opacity-50" />
               </div>
               <p className="font-medium">{searchQuery ? `No se encontraron resultados para "${searchQuery}"` : "No hay registro de envíos procesados o pendientes."}</p>
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
