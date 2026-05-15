import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Package, Calendar, Filter } from "lucide-react";
import Link from "next/link";
import { FilaPedido } from "../components/FilaPedido";
import { BuscadorPedidos } from "../components/BuscadorPedidos";
import { FiltroEstado } from "../components/FiltroEstado";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PedidosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = (params.q as string) || "";
  const estado = (params.estado as string) || "";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true }
  });
  
  if (!usuarioDB || !usuarioDB.empresa) redirect("/dashboard");

  // Obtener pedidos filtrados
  const todosLosPedidos = await prisma.pedido.findMany({
    where: { 
      empresaId: usuarioDB.empresa.id,
      ...(estado && { estado }),
      OR: query ? [
        { nombreCliente: { contains: query, mode: "insensitive" } },
        { producto: { contains: query, mode: "insensitive" } },
        { direccion: { contains: query, mode: "insensitive" } },
      ] : undefined,
    },
    include: { repartidor: true },
    orderBy: { createdAt: "desc" },
  });

  const repartidores = await prisma.usuario.findMany({
    where: { empresaId: usuarioDB.empresa.id, rol: "repartidor" }
  });

  return (
    <div className="font-sans px-2">
      <div className="max-w-[85rem] mx-auto">
        <header className="mb-10 lg:mb-12 flex flex-col xl:flex-row justify-between items-start xl:items-end border-b border-zinc-800/50 pb-8 gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-1 flex items-center gap-2">
               <Package className="w-4 h-4" />
               Historial Logístico
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-2">
              Todos los <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Pedidos</span>
            </h1>
            <p className="text-zinc-500/90 text-sm md:text-base max-w-xl">
              Visualiza y administra el historial completo de envíos.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
             <FiltroEstado />
             <div className="flex items-center gap-3 w-full md:w-auto">
                <BuscadorPedidos />
                <button className="p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all shadow-sm">
                   <Calendar className="w-4 h-4" />
                </button>
             </div>
          </div>
        </header>

        <section className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 shadow-xl min-h-[500px]">
          {todosLosPedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
               <Package className="w-12 h-12 mb-4 opacity-50" />
               <p>{query || estado ? "No se encontraron pedidos que coincidan con los filtros." : "No hay registro de envíos procesados o pendientes."}</p>
               {(query || estado) && (
                 <Link 
                   href="/dashboard/pedidos"
                   className="mt-4 text-amber-500 text-sm font-bold hover:underline"
                 >
                   Limpiar filtros
                 </Link>
               )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {todosLosPedidos.map((pedido) => (
                <FilaPedido key={pedido.id} pedido={pedido} repartidores={repartidores} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

