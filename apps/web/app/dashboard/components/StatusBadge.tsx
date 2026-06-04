export type OrderStatus = "pendiente" | "en_ruta" | "entregado" | "fallido";

const MAP: Record<string, { label: string; cls: string }> = {
  pendiente: { label: "PENDIENTE", cls: "bg-zinc-800/50 text-zinc-400 border-zinc-700" },
  en_ruta:   { label: "EN CAMINO", cls: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  entregado: { label: "ENTREGADO", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  fallido:   { label: "CANCELADO", cls: "bg-red-500/10 text-red-400 border-red-500/30" },
};

export function StatusBadge({ estado, className }: { estado: string; className?: string }) {
  const { label, cls } = MAP[estado] || MAP.pendiente;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-widest ${cls} ${className || ""}`}
    >
      {label}
    </span>
  );
}
