"use client";

import { useState } from "react";
import { BotonesTabla } from "./BotonesTabla";
import { toast } from "sonner";
import { editarPedido } from "../actions";
import { Edit3, Save } from "lucide-react";
import { Pedido } from "@prisma/client";

export function FilaPedido({ pedido }: { pedido: Pedido }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Acción cliente para procesar la edición del pedido
  async function handleGuardarEdicion(formData: FormData) {
    setIsSaving(true);
    toast.loading("Guardando cambios...", { id: "editar-" + pedido.id });
    
    // Inyectamos el ID oculto
    formData.append("pedidoId", pedido.id);

    try {
      const res = await editarPedido(formData);
      if (res?.error) {
        toast.error(res.error, { id: "editar-" + pedido.id });
        return;
      }
      toast.success("Pedido actualizado ✏️", { id: "editar-" + pedido.id });
      setIsEditing(false); // Salir de modo edición
    } catch {
      toast.error("Error al guardar cambios", { id: "editar-" + pedido.id });
    } finally {
      setIsSaving(false);
    }
  }

  // --- MODO EDICIÓN ---
  if (isEditing) {
    return (
      <form action={handleGuardarEdicion} className="flex flex-col gap-3 p-5 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-emerald-500/40 shadow-[0_0_25px_rgba(52,211,153,0.15)] transition-all relative mt-3 mb-2 group">
        <h3 className="text-emerald-400 text-[10px] uppercase font-bold tracking-widest absolute top-[-10px] bg-zinc-900 border border-emerald-500/40 px-3 py-1 left-5 rounded-full shadow-sm flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Editando
        </h3>
        
        <div className="grid grid-cols-2 gap-3 mt-3">
          <input name="producto" defaultValue={pedido.producto} required className="bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-4 py-2 text-sm focus:bg-zinc-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 outline-none text-zinc-100 font-bold uppercase transition-all" />
          <input name="cliente" defaultValue={pedido.nombreCliente} required className="bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-4 py-2 text-sm focus:bg-zinc-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 outline-none text-zinc-100 transition-all" />
          <input name="direccion" defaultValue={pedido.direccion} required className="bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-4 py-2 text-sm col-span-2 focus:bg-zinc-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 outline-none text-zinc-100 transition-all" />
        </div>
        
        <div className="flex gap-3 justify-end mt-2">
          <button type="button" onClick={() => setIsEditing(false)} disabled={isSaving} className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={isSaving} className="px-5 py-2 text-xs rounded-xl bg-emerald-500 hover:bg-emerald-400 hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] text-zinc-950 font-extrabold transition-all duration-300 disabled:opacity-50 flex gap-2 items-center active:scale-95">
             {isSaving ? <span className="w-3.5 h-3.5 rounded-full border-2 border-zinc-950/20 border-t-zinc-950 animate-spin" /> : <><Save strokeWidth={2.5} className="w-3.5 h-3.5"/> Guardar Cambios</>}
          </button>
        </div>
      </form>
    );
  }

  // --- MODO LECTURA NORMAL ---
  return (
    <div className="flex justify-between items-center p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex flex-col gap-1 pr-4">
        <h3 className="font-extrabold text-sm uppercase tracking-wide text-zinc-100 border-b border-zinc-800/60 pb-1 mb-1 inline-block w-fit">
          {pedido.producto} 
        </h3>
        <p className="text-xs text-zinc-400 truncate max-w-[200px] md:max-w-md lg:max-w-xs font-medium">📍 {pedido.direccion}</p>
        <p className="text-xs text-zinc-500 truncate mt-0.5">👤 {pedido.nombreCliente}</p>
      </div>
      
      <div className="flex items-center gap-3">
        
        {/* BOTÓN EXTRA DE EDITAR */}
        {pedido.estado === "pendiente" && (
           <button 
             onClick={() => setIsEditing(true)} 
             className="p-2 border border-zinc-700/50 bg-zinc-800/30 hover:bg-amber-500/10 hover:border-amber-500/30 text-zinc-400 hover:text-amber-400 rounded-xl transition-all w-9 h-9 flex justify-center items-center group/edit active:scale-95" title="Editar pedido"
           >
             <Edit3 strokeWidth={2} className="w-4 h-4 group-hover/edit:scale-110 transition-transform" />
           </button>
        )}

        <BotonesTabla pedidoId={pedido.id} estado={pedido.estado} />

        {/* BADGE DE RIESGO */}
        <span className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-extrabold rounded-xl whitespace-nowrap shadow-sm border ${
          (pedido.scoreRiesgo ?? 0) > 70 ? "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]" : 
          (pedido.scoreRiesgo ?? 0) > 40 ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : 
          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        }`}>
            {(pedido.scoreRiesgo === 0 && pedido.estado === "entregado") ? "Entrega Segura" : `Alerta: ${pedido.scoreRiesgo}%`}
        </span>
      </div>
    </div>
  );
}
