"use client";

import { useState } from "react";
import { crearEmpresa } from "../actions";
import { X, Building2, Mail, CreditCard } from "lucide-react";
import { toast } from "sonner";

export function CrearEmpresaModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const id = toast.loading("Creando empresa...");
    try {
      await crearEmpresa(formData);
      toast.success("Empresa creada exitosamente", { id });
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear empresa", { id });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all active:scale-95 shadow-lg shadow-violet-900/30"
      >
        <span className="text-base leading-none">+</span> Crear Empresa
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-8 relative">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Nueva Empresa</h2>
                <p className="text-xs text-zinc-500">Registra un nuevo tenant en RouteAI</p>
              </div>
            </div>
            <form action={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> Nombre
                </label>
                <input name="nombre" required placeholder="Ej: Logística Norte SPA"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Email de Contacto
                </label>
                <input name="email" type="email" required placeholder="contacto@empresa.com"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" /> Plan
                </label>
                <select name="plan" defaultValue="pro"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm transition-all">
                  <option value="starter">🟢 Starter — Hasta 50 pedidos/mes</option>
                  <option value="pro">🔵 Pro — Hasta 500 pedidos/mes</option>
                  <option value="business">🟣 Business — Ilimitado</option>
                </select>
              </div>
              <button type="submit" disabled={loading}
                className="w-full mt-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> : "Crear Empresa"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
