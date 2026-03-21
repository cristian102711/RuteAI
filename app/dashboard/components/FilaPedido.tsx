"use client";

import { useState } from "react";
import { BotonesTabla } from "./BotonesTabla";
import { toast } from "sonner";
import { editarPedido } from "../actions";
import { Edit3, Save } from "lucide-react";

export function FilaPedido({ pedido }: { pedido: any }) {
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
      <form action={handleGuardarEdicion} className="flex flex-col gap-3 p-4 rounded-xl bg-zinc-900 border border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.1)] transition relative mt-2">
        <h3 className="text-emerald-400 text-sm font-bold absolute top-[-10px] bg-zinc-950 px-2 left-4 rounded-full border border-emerald-500/20">Editando Fila</h3>
        
        <div className="grid grid-cols-2 gap-2 mt-2">
          <input name="producto" defaultValue={pedido.producto} required className="bg-zinc-950 border border-zinc-700 rounded-md px-3 py-1 text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-white font-bold uppercase" />
          <input name="cliente" defaultValue={pedido.nombreCliente} required className="bg-zinc-950 border border-zinc-700 rounded-md px-3 py-1 text-sm focus:ring-1 focus:ring-emerald-500 outline-none" />
          <input name="direccion" defaultValue={pedido.direccion} required className="bg-zinc-950 border border-zinc-700 rounded-md px-3 py-1 text-sm col-span-2 focus:ring-1 focus:ring-emerald-500 outline-none" />
        </div>
        
        <div className="flex gap-2 justify-end mt-2">
          <button type="button" onClick={() => setIsEditing(false)} disabled={isSaving} className="px-3 py-1 text-xs rounded-md border border-zinc-600 hover:bg-zinc-800 transition disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={isSaving} className="px-3 py-1 text-xs rounded-md bg-emerald-600 hover:bg-emerald-500 text-black font-bold transition disabled:opacity-50 flex gap-2 items-center">
             {isSaving ? <span className="w-3 h-3 rounded-full border-2 border-black/20 border-t-black animate-spin" /> : <><Save strokeWidth={2.5} className="w-3 h-3"/> Guardar</>}
          </button>
        </div>
      </form>
    );
  }

  // --- MODO LECTURA NORMAL ---
  return (
    <div className="flex justify-between items-center p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition group">
      <div>
        <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-200">
          {pedido.producto} 
        </h3>
        <p className="text-xs text-zinc-500 truncate w-48">{pedido.direccion} • {pedido.nombreCliente}</p>
      </div>
      
      <div className="flex items-center gap-3">
        
        {/* BOTÓN EXTRA DE EDITAR */}
        {pedido.estado === "pendiente" && (
           <button 
             onClick={() => setIsEditing(true)} 
             className="p-2 border border-orange-500/50 hover:bg-orange-500/20 text-orange-400 rounded-full transition w-8 h-8 flex justify-center items-center group/edit" title="Editar información del cliente"
           >
             <Edit3 strokeWidth={2} className="w-4 h-4 group-hover/edit:scale-110 transition-transform" />
           </button>
        )}

        <BotonesTabla pedidoId={pedido.id} estado={pedido.estado} />

        {/* BADGE DE RIESGO */}
        <span className={`px-3 py-1 text-xs font-bold rounded-md whitespace-nowrap ${
          (pedido.scoreRiesgo ?? 0) > 70 ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]" : 
          (pedido.scoreRiesgo ?? 0) > 40 ? "bg-yellow-500 text-black" : 
          "bg-zinc-800 text-emerald-400"
        }`}>
            {(pedido.scoreRiesgo === 0 && pedido.estado === "entregado") ? "Riesgo: 0% (Entregado)" : `Riesgo: ${pedido.scoreRiesgo}%`}
        </span>
      </div>
    </div>
  );
}
