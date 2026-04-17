"use client";

import { useState } from "react";
import { toast } from "sonner";
import { agregarPedidoNuevo } from "../actions";
import { Zap } from "lucide-react";

export function FormCrearPedido({ empresaId }: { empresaId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAction(formData: FormData) {
    setIsSubmitting(true);
    toast.loading("Procesando con RouteAI...", { id: "crear-pedido" });
    
    try {
      const res = await agregarPedidoNuevo(formData, empresaId);
      if (res?.error) {
         toast.error(res.error, { id: "crear-pedido" });
         return;
      }
      toast.success("Pedido despachado exitosamente", { id: "crear-pedido" });
      // Limpiar formulario si fue exitoso (opcional, dependerá de la ref en react 19)
    } catch {
      toast.error("Hubo un fallo general en la red", { id: "crear-pedido" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase ml-1">Destinatario</label>
        <input name="cliente" placeholder="Ej: Juan Pérez" required className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-100 placeholder-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 shadow-inner transition-all text-sm disabled:opacity-50" disabled={isSubmitting} />
      </div>
      
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase ml-1">Dirección de Entrega</label>
        <input name="direccion" placeholder="Ej: Av. Providencia 1234" required className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-100 placeholder-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 shadow-inner transition-all text-sm disabled:opacity-50" disabled={isSubmitting} />
      </div>
      
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase ml-1">Despacho / SKU</label>
        <input name="producto" placeholder="Identificador del equipo" required className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-100 placeholder-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 shadow-inner transition-all text-sm font-bold uppercase tracking-wider disabled:opacity-50" disabled={isSubmitting} />
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="mt-4 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(52,211,153,0.4)] text-zinc-950 font-extrabold text-sm px-4 py-3.5 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group w-full tracking-wide"
      >
        {isSubmitting ? <span className="w-5 h-5 rounded-full border-2 border-zinc-900/20 border-t-zinc-950 animate-spin" /> : <><Zap strokeWidth={2.5} className="w-4 h-4 text-zinc-950 group-hover:scale-110 transition-transform" /> Iniciar Tracking e IA</>}
      </button>
    </form>
  );
}
