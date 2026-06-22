import { formatearAtraso } from "@/lib/logistica";

export type OrderStatus =
  | "pendiente"
  | "en_ruta"
  | "entregado"
  | "fallido"
  | "cancelado";

const MAP: Record<string, { label: string; cls: string }> = {
  pendiente: { label: "PENDIENTE", cls: "bg-zinc-800/50 text-zinc-400 border-zinc-700" },
  en_ruta:   { label: "EN CAMINO", cls: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  entregado: { label: "ENTREGADO", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  fallido:   { label: "FALLIDO", cls: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
  cancelado: { label: "CANCELADO", cls: "bg-red-500/10 text-red-400 border-red-500/30" },
};

export function StatusBadge({
  estado,
  atrasado = false,
  minutosAtraso = 0,
  className,
}: {
  estado: string;
  atrasado?: boolean;
  minutosAtraso?: number;
  className?: string;
}) {
  const { label, cls } = MAP[estado] || MAP.pendiente;

  const badge = (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-widest ${cls} ${className || ""}`}
    >
      {label}
    </span>
  );

  // Sin atraso → solo el badge (mantiene la API/estructura previa).
  if (!atrasado) return badge;

  return (
    <span className="inline-flex items-center gap-1.5">
      {badge}
      <span
        className="inline-flex items-center rounded-full border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-rose-400 animate-pulse"
        title="Pedido fuera del plazo de entrega (SLA)"
      >
        ⏱ ATRASADO {minutosAtraso > 0 ? `· ${formatearAtraso(minutosAtraso)}` : ""}
      </span>
    </span>
  );
}
