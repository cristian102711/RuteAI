"use client";

import { eliminarUsuario } from "../actions";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function EliminarUsuarioButton({ id, nombre }: { id: string; nombre: string }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const toastId = toast.loading(`Eliminando a ${nombre}...`);
    try {
      await eliminarUsuario(id);
      toast.success(`${nombre} eliminado del sistema`, { id: toastId });
    } catch {
      toast.error("Error al eliminar el usuario", { id: toastId });
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  }

  if (confirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar usuario?</h3>
            <p className="text-sm text-zinc-400">
              Esto eliminará a <span className="text-white font-semibold">{nombre}</span> del sistema permanentemente. No podrá iniciar sesión.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setConfirm(false)}
              className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-sm font-semibold">
              Cancelar
            </button>
            <button onClick={handleDelete} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-sm">
              {loading
                ? <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                : "Sí, eliminar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirm(true)} title="Eliminar usuario"
      className="p-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all active:scale-95">
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
