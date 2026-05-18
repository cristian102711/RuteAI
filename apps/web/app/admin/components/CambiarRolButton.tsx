"use client";

import { cambiarRolUsuario } from "../actions";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ROLES = ["encargado", "repartidor"] as const;
type Rol = (typeof ROLES)[number];

const ROL_LABELS: Record<Rol, string> = {
  encargado: "Encargado",
  repartidor: "Repartidor",
};

export function CambiarRolButton({ id, rolActual, nombre }: { id: string; rolActual: string; nombre: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCambiar(nuevoRol: Rol) {
    if (nuevoRol === rolActual) { setOpen(false); return; }
    setLoading(true);
    const toastId = toast.loading(`Cambiando rol de ${nombre}...`);
    try {
      await cambiarRolUsuario(id, nuevoRol);
      toast.success(`${nombre} ahora es ${ROL_LABELS[nuevoRol]}`, { id: toastId });
      setOpen(false);
    } catch {
      toast.error("Error al cambiar el rol", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        title="Cambiar rol"
        disabled={loading}
        className="p-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/10 transition-all active:scale-95 disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-9 z-50 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-3 py-2 border-b border-zinc-800">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cambiar a</p>
            </div>
            {ROLES.map((rol) => (
              <button
                key={rol}
                onClick={() => handleCambiar(rol)}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors ${
                  rol === rolActual
                    ? "text-violet-400 bg-violet-500/10 font-semibold"
                    : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${rol === "encargado" ? "bg-blue-400" : "bg-amber-400"}`} />
                {ROL_LABELS[rol]}
                {rol === rolActual && <span className="ml-auto text-[10px] text-violet-400">ACTUAL</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
