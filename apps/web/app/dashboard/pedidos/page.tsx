import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Sparkles, Plus } from "lucide-react";
import Link from "next/link";
import { PedidosTable } from "../components/PedidosTable";

export default async function PedidosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true },
  });
  if (!usuarioDB?.empresa) redirect("/dashboard");

  const [todosLosPedidos, repartidores] = await Promise.all([
    prisma.pedido.findMany({
      where: { empresaId: usuarioDB.empresa.id },
      select: {
        id: true,
        producto: true,
        nombreCliente: true,
        direccion: true,
        estado: true,
        scoreRiesgo: true,
        repartidorId: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.usuario.findMany({
      where: { empresaId: usuarioDB.empresa.id, rol: "repartidor" },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const total = todosLosPedidos.length;

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto text-zinc-100 selection:bg-amber-500/30">

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-500 font-bold">Operación</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Pedidos</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {total} pedido{total !== 1 ? "s" : ""} en cola · {repartidores.length} repartidor{repartidores.length !== 1 ? "es" : ""} disponible{repartidores.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/pedidos/crear"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-white/5 hover:bg-white/10 transition-colors px-3 py-2 text-sm text-white"
          >
            <Plus className="h-4 w-4" /> Nuevo pedido
          </Link>
          <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-400 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:opacity-90 transition-opacity">
            <Sparkles className="h-4 w-4" /> Optimizar Rutas con IA
          </button>
        </div>
      </div>

      {/* Tabla integrada con Filtros */}
      <PedidosTable pedidos={todosLosPedidos} repartidores={repartidores} />

    </div>
  );
}
