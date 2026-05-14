"use client";

import { useState } from "react";
import { editarEmpresa } from "../actions";
import { X, Building2, Mail, CreditCard, Edit } from "lucide-react";
import { toast } from "sonner";

interface Empresa {
  id: string;
  nombre: string;
  email: string;
  plan: string;
}

export function EditarEmpresaModal({ empresa }: { empresa: Empresa }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const id = toast.loading("Guardando cambios...");
    try {
      await editarEmpresa(formData);
      toast.success("Empresa actualizada correctamente", { id });
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar", { id });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} title="Editar empresa"
        className="p-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/10 transition-all active:scale-95">
        <Edit className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-8 relative">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Edit className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Editar Empresa</h2>
                <p className="text-xs text-zinc-500">Modifica los datos del tenant</p>
              </div>
            </div>
            <form action={handleSubmit} className="flex flex-col gap-4">
              <input type="hidden" name="id" value={empresa.id} />
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> Nombre
                </label>
                <input name="nombre" required defaultValue={empresa.nombre}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input name="email" type="email" required defaultValue={empresa.email}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" /> Plan
                </label>
                <select name="plan" defaultValue={empresa.plan}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all">
                  <option value="starter">🟢 Starter — Hasta 50 pedidos/mes</option>
                  <option value="pro">🔵 Pro — Hasta 500 pedidos/mes</option>
                  <option value="business">🟣 Business — Ilimitado</option>
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-sm font-semibold">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm">
                  {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
