import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import Link from "next/link";
import { callCore } from "@/lib/coreServiceClient";
import prisma from "@ruteai/database";
import { PedidosPageClient } from "./PedidosPageClient";

export default async function PedidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Empresa y repartidores
  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { empresaId: true },
  });
  const repartidores = usuarioDB
    ? await prisma.usuario.findMany({
        where: { empresaId: usuarioDB.empresaId, rol: "repartidor" },
        select: { id: true, nombre: true },
        orderBy: { nombre: "asc" },
      })
    : [];

  // Pedidos — intenta core-service, fallback Prisma directo
  let todosLosPedidos: any[] = [];
  if (process.env.CORE_SERVICE_URL) {
    try {
      todosLosPedidos = await callCore<any[]>("/api/v1/orders");
    } catch {
      console.warn("[PedidosPage] core-service no disponible, usando Prisma");
    }
  }
  if (todosLosPedidos.length === 0 && usuarioDB) {
    todosLosPedidos = await prisma.pedido.findMany({
      where: { empresaId: usuarioDB.empresaId },
      orderBy: { createdAt: "desc" },
      include: { repartidor: { select: { id: true, nombre: true } } },
    });
  }

  const total = todosLosPedidos.length;

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto text-zinc-100 selection:bg-amber-500/30">

      {/* Header — renderizado en el servidor */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-500 font-bold">
            Operación
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
            Pedidos
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {total} pedido{total !== 1 ? "s" : ""} en cola hoy
          </p>
        </div>

        <Link
          href="/dashboard/pedidos/crear"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-white/5 hover:bg-white/10 transition-colors px-3 py-2 text-sm text-white"
        >
          <Plus className="h-4 w-4" /> Nuevo pedido
        </Link>
      </div>

      {/* Sección interactiva: botones IA + tabla con estado compartido */}
      <PedidosPageClient
        pedidosIniciales={todosLosPedidos}
        repartidores={repartidores}
      />
    </div>
  );
}
