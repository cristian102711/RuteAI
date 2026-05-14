"use client";

import { toggleEmpresaEstado } from "../actions";
import { Power } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ToggleEmpresaButton({ id, activa, nombre }: { id: string; activa: boolean; nombre: string }) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const toastId = toast.loading(activa ? `Desactivando ${nombre}...` : `Activando ${nombre}...`);
    try {
      await toggleEmpresaEstado(id, activa);
      toast.success(activa ? `${nombre} desactivada` : `${nombre} activada`, { id: toastId });
    } catch {
      toast.error("Error al cambiar el estado", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={activa ? "Desactivar plan" : "Activar plan"}
      className={`p-2 rounded-lg border transition-all active:scale-95 disabled:opacity-50 ${
        activa
          ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
      }`}
    >
      {loading
        ? <span className="w-3.5 h-3.5 block rounded-full border-2 border-current/30 border-t-current animate-spin" />
        : <Power className="w-3.5 h-3.5" />
      }
    </button>
  );
}
