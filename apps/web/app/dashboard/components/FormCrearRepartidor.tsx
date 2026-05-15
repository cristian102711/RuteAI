"use client";

import { useState } from "react";
import { toast } from "sonner";
import { agregarRepartidor } from "../actions";
import { UserPlus } from "lucide-react";

export function FormCrearRepartidor({ empresaId }: { empresaId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAction(formData: FormData) {
    setIsSubmitting(true);
    toast.loading("Registrando repartidor...", { id: "crear-repartidor" });
    
    try {
      const res = await agregarRepartidor(formData, empresaId);
      if (res?.error) {
         toast.error(res.error, { id: "crear-repartidor" });
         return;
      }
      toast.success("Repartidor agregado al equipo", { id: "crear-repartidor" });
    } catch {
      toast.error("Error al registrar", { id: "crear-repartidor" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleAction} className="flex flex-col gap-3">
      <input name="nombre" placeholder="Nombre completo" required className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50 text-white" disabled={isSubmitting} />
      <input name="email" type="email" placeholder="Correo electrónico" required className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50 text-white" disabled={isSubmitting} />
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="mt-1 flex justify-center items-center gap-2 bg-blue-500 hover:bg-blue-400 text-black font-bold text-sm px-4 py-2 rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed group"
      >
        {isSubmitting ? <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" /> : <><UserPlus className="w-4 h-4 text-black group-hover:scale-110 transition-transform" /> Agregar Repartidor</>}
      </button>
    </form>
  );
}
