"use client";

import { useRouter, useSearchParams } from "next/navigation";

const ESTADOS = [
  { id: "todos", label: "Todos" },
  { id: "pendiente", label: "Pendientes" },
  { id: "en_ruta", label: "En Ruta" },
  { id: "entregado", label: "Entregados" },
  { id: "fallido", label: "Fallidos" },
];

export function FiltroEstado() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("estado") || "todos";

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(window.location.search);
    if (status === "todos") {
      params.delete("estado");
    } else {
      params.set("estado", status);
    }
    router.replace(`/dashboard/pedidos?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
      {ESTADOS.map((estado) => (
        <button
          key={estado.id}
          onClick={() => handleStatusChange(estado.id)}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 border ${
            currentStatus === estado.id
              ? "bg-amber-500 border-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
          }`}
        >
          {estado.label}
        </button>
      ))}
    </div>
  );
}
