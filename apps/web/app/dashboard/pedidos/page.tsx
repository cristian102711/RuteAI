import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PedidosTable } from "../components/PedidosTable";
import { OptimizarRutasButton } from "../components/OptimizarRutasButton";
import { callCore } from "@/lib/coreServiceClient";

export default async function PedidosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Lista de pedidos de la empresa (empresaId derivado del token en core)
  let todosLosPedidos: any[] = [];
  try {
    todosLosPedidos = await callCore<any[]>("/api/v1/orders");
  } catch {
    redirect("/dashboard");
  }

  const total = todosLosPedidos.length;

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto text-zinc-100 selection:bg-amber-500/30">
      
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-500 font-bold">Operación</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Pedidos</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {total} pedido{total !== 1 ? "s" : ""} en cola hoy
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/pedidos/crear"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-white/5 hover:bg-white/10 transition-colors px-3 py-2 text-sm text-white"
          >
            <Plus className="h-4 w-4" /> Nuevo pedido
          </Link>
          <OptimizarRutasButton />
        </div>
      </div>

      {/* Tabla integrada con Filtros */}
      <PedidosTable pedidos={todosLosPedidos} />
      
    </div>
  );
}
