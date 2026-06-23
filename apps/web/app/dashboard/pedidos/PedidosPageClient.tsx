"use client";

import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { PedidosTable } from "../components/PedidosTable";
import { OptimizarRutasButton } from "../components/OptimizarRutasButton";

interface Pedido {
  id: string;
  producto: string;
  nombreCliente: string;
  direccion: string;
  estado: string;
  scoreRiesgo: number | null;
  repartidorId?: string | null;
  fechaEntregaLimite?: string | Date | null;
  entregadoEn?: string | Date | null;
}

interface Repartidor {
  id: string;
  nombre: string;
}

interface Props {
  pedidosIniciales: Pedido[];
  repartidores: Repartidor[];
}

export function PedidosPageClient({ pedidosIniciales, repartidores }: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciales);
  const [razonIA, setRazonIA] = useState<string | null>(null);
  const [reorganizando, setReorganizando] = useState(false);

  async function reorganizarConIA() {
    setReorganizando(true);
    try {
      const res = await fetch("/api/ai/reorganize", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "No se pudo reorganizar");
        return;
      }

      const { idsOrdenados, razon } = json.data as {
        idsOrdenados: string[];
        razon: string;
        totalPedidos: number;
      };

      // Reordenar los pedidos en memoria según el resultado de la IA
      const porId = new Map(pedidos.map((p) => [p.id, p]));
      const reordenados = idsOrdenados
        .map((id) => porId.get(id))
        .filter((p): p is Pedido => p !== undefined);

      // Incluir al final cualquier pedido que la IA no haya devuelto
      const idsRetornados = new Set(idsOrdenados);
      const omitidos = pedidos.filter((p) => !idsRetornados.has(p.id));

      setPedidos([...reordenados, ...omitidos]);
      setRazonIA(razon);
      toast.success(`Pedidos reorganizados · ${reordenados.length} órdenes`);
    } catch {
      toast.error("Error al conectar con la IA");
    } finally {
      setReorganizando(false);
    }
  }

  function restablecer() {
    setPedidos(pedidosIniciales);
    setRazonIA(null);
  }

  return (
    <div className="space-y-4">
      {/* Fila de botones de acción */}
      <div className="flex flex-wrap items-center gap-2">
        <OptimizarRutasButton />
        <button
          onClick={reorganizarConIA}
          disabled={reorganizando || pedidos.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(139,92,246,0.35)] hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {reorganizando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {reorganizando ? "Analizando con IA…" : "Reorganizar Prioridad IA"}
        </button>
      </div>

      {/* Banner de razonamiento de la IA */}
      {razonIA && (
        <div className="flex items-start gap-3 rounded-xl border border-purple-500/20 bg-purple-500/[0.06] px-4 py-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Reorganizado por Open Router IA
            </span>
            <p className="mt-0.5 text-sm text-zinc-300 leading-relaxed">{razonIA}</p>
          </div>
          <button
            onClick={restablecer}
            title="Restablecer orden original"
            className="ml-2 shrink-0 rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabla de pedidos (recibe el orden actual) */}
      <PedidosTable pedidos={pedidos} repartidores={repartidores} />
    </div>
  );
}
