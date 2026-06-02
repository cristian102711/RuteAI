"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { asignarRepartidor } from "../actions";

interface Repartidor {
  id: string;
  nombre: string;
}

interface Props {
  pedidoId: string;
  repartidorActualId: string | null;
  repartidores: Repartidor[];
  readonly?: boolean;
}

export function AsignarRepartidor({ pedidoId, repartidorActualId, repartidores, readonly }: Props) {
  const [isPending, startTransition] = useTransition();
  const [valorActual, setValorActual] = useState(repartidorActualId ?? "");

  if (readonly) {
    const nombre = repartidores.find(r => r.id === repartidorActualId)?.nombre;
    return (
      <span className="text-sm text-zinc-400">
        {nombre ?? <span className="italic text-zinc-600">Sin asignar</span>}
      </span>
    );
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nuevoId = e.target.value;
    setValorActual(nuevoId);
    startTransition(async () => {
      await asignarRepartidor(pedidoId, nuevoId || null);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={valorActual}
        onChange={handleChange}
        disabled={isPending}
        className="max-w-[150px] rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500/40 disabled:opacity-50"
      >
        <option value="">Sin asignar</option>
        {repartidores.map(r => (
          <option key={r.id} value={r.id}>{r.nombre}</option>
        ))}
      </select>
      {isPending && <Loader2 className="h-3 w-3 animate-spin text-zinc-500 shrink-0" />}
    </div>
  );
}
