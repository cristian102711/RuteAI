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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 rounded-3xl bg-card-bg/60 border border-border-ui hover:border-emerald-500/40 hover:bg-card-bg hover:shadow-[0_0_30px_rgba(52,211,153,0.05)] hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden min-h-[110px] backdrop-blur-xl">
      {/* Indicador lateral Dinámico */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500/0 group-hover:bg-emerald-500/60 group-hover:shadow-[4px_0_15px_rgba(52,211,153,0.4)] transition-all duration-500" />
      
      {/* Light Reflection Effect on Hover */}
      <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent group-hover:left-[100%] transition-all duration-700 pointer-events-none" />
      
      <div className="flex flex-col gap-2 pr-4 relative z-10 flex-1 w-full md:w-auto mb-4 md:mb-0">
        <h3 className="font-black text-lg md:text-xl uppercase tracking-wider text-foreground group-hover:text-emerald-500 transition-colors leading-tight">
          {pedido.producto} 
        </h3>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium flex items-start gap-2 leading-snug">
            <span className="text-emerald-500/70 text-xs mt-1">📍</span> 
            <span className="line-clamp-2 md:line-clamp-1">{pedido.direccion}</span>
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-2">
            <span className="text-emerald-500/50 text-xs">👤</span> {pedido.nombreCliente}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 md:gap-4 relative z-10 shrink-0 w-full md:w-auto justify-end border-t border-border-ui md:border-none pt-3 md:pt-0">
        
        {/* BOTÓN EXTRA DE EDITAR */}
        {pedido.estado === "pendiente" && (
           <button 
             onClick={() => setIsEditing(true)} 
             className="p-2.5 border border-border-ui bg-background/50 hover:bg-amber-500/10 hover:border-amber-500/30 text-zinc-500 hover:text-amber-500 rounded-2xl transition-all w-10 h-10 flex justify-center items-center group/edit active:scale-95 shadow-sm" title="Editar pedido"
           >
             <Edit3 strokeWidth={2.5} className="w-4 h-4 group-hover/edit:scale-110 transition-transform" />
           </button>
        )}

        <BotonesTabla pedidoId={pedido.id} estado={pedido.estado} />

        {/* BADGE DE RIESGO */}
        <span className={`px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-black rounded-2xl whitespace-nowrap shadow-sm border transition-all duration-500 ${
          (pedido.scoreRiesgo ?? 0) > 70 ? "bg-rose-500/10 text-rose-500 border-rose-500/30" : 
          (pedido.scoreRiesgo ?? 0) > 40 ? "bg-amber-500/10 text-amber-500 border-amber-500/30" : 
          "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:border-emerald-500/40"
        }`}>
            {(pedido.scoreRiesgo === 0 && pedido.estado === "entregado") ? "Entrega Segura" : `Alerta: ${pedido.scoreRiesgo}%`}
        </span>
      </div>
    </div>
  );
}
