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
    <form action={handleAction} className="flex flex-col gap-4">
      <input name="cliente" placeholder="Nombre Destinatario (Ej: Juan Pérez)" required className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition disabled:opacity-50 text-white" disabled={isSubmitting} />
      <input name="direccion" placeholder="Dirección de Envío" required className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition disabled:opacity-50 text-white" disabled={isSubmitting} />
      <input name="producto" placeholder="Producto o Nota Flete" required className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition disabled:opacity-50 text-white font-bold uppercase" disabled={isSubmitting} />
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="mt-2 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm px-4 py-3 rounded-lg transition shadow-[0_0_15px_rgba(52,211,153,0.2)] disabled:opacity-70 disabled:cursor-not-allowed group"
      >
        {isSubmitting ? <span className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" /> : <><Zap className="w-4 h-4 text-black group-hover:scale-110 transition-transform" /> Crear y Evaluar con IA</>}
      </button>
    </form>
  );
}
