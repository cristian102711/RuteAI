"use client";

import { useState } from "react";
import { BotonesTabla } from "./BotonesTabla";
import { toast } from "sonner";
import { editarPedido } from "../actions";
import { Edit3, Save } from "lucide-react";
import { Pedido } from "@ruteai/database";
import { StatusBadge } from "./StatusBadge";
import { ScoreBadge } from "./ScoreBadge";

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
      <form action={handleGuardarEdicion} className="flex flex-col gap-3 p-5 rounded-2xl bg-card border border-primary/40 shadow-md transition-all relative mt-3 mb-2 group">
        <h3 className="text-primary text-[10px] uppercase font-bold tracking-widest absolute top-[-10px] bg-card border border-primary/40 px-3 py-1 left-5 rounded-full shadow-sm flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span> Editando
        </h3>
        
        <div className="grid grid-cols-2 gap-3 mt-3">
          <input name="producto" defaultValue={pedido.producto} required placeholder="Producto" className="bg-secondary border border-border-ui rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-foreground font-bold uppercase transition-all" />
          <input name="cliente" defaultValue={pedido.nombreCliente} required placeholder="Cliente" className="bg-secondary border border-border-ui rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-foreground transition-all" />
          <input name="clienteTelefono" defaultValue={pedido.clienteTelefono || ""} placeholder="Teléfono (Ej: +56912345678)" className="bg-secondary border border-border-ui rounded-xl px-4 py-2 text-sm col-span-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-foreground transition-all" />
          <input name="direccion" defaultValue={pedido.direccion} required placeholder="Dirección" className="bg-secondary border border-border-ui rounded-xl px-4 py-2 text-sm col-span-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-foreground transition-all" />
        </div>
        
        <div className="flex gap-3 justify-end mt-2">
          <button type="button" onClick={() => setIsEditing(false)} disabled={isSaving} className="px-4 py-2 text-xs font-semibold rounded-xl border border-border-ui text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={isSaving} className="px-5 py-2 text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold transition-all duration-300 disabled:opacity-50 flex gap-2 items-center active:scale-95">
             {isSaving ? <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground animate-spin" /> : <><Save strokeWidth={2.5} className="w-3.5 h-3.5"/> Guardar Cambios</>}
          </button>
        </div>
      </form>
    );
  }

  // --- MODO LECTURA NORMAL ---
  return (
    <div className="flex justify-between items-center p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:border-emerald-500/30 hover:bg-zinc-800/40 hover:shadow-md transition-all duration-300 group">
      <div className="flex flex-col gap-1 pr-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-xs font-bold text-emerald-400">#{pedido.id.slice(-4).toUpperCase()}</span>
          <StatusBadge estado={pedido.estado} />
        </div>
        <p className="text-sm font-semibold text-white">📍 {pedido.direccion}</p>
        <p className="text-xs text-zinc-500 truncate max-w-[200px] md:max-w-md lg:max-w-xs mt-0.5">👤 {pedido.nombreCliente} {pedido.clienteTelefono && `• 📞 ${pedido.clienteTelefono}`}</p>
      </div>
      
      <div className="flex items-center gap-4">
        
        <ScoreBadge score={pedido.scoreRiesgo ?? 0} />
        
        {/* BOTÓN EXTRA DE EDITAR */}
        {pedido.estado === "pendiente" && (
           <button 
             onClick={() => setIsEditing(true)} 
             className="p-2 border border-zinc-700 bg-zinc-800/50 hover:bg-yellow-500/10 hover:border-yellow-500/30 text-zinc-500 hover:text-yellow-500 rounded-xl transition-all w-8 h-8 flex justify-center items-center group/edit active:scale-95" title="Editar pedido"
           >
             <Edit3 strokeWidth={2} className="w-3.5 h-3.5 group-hover/edit:scale-110 transition-transform" />
           </button>
        )}

        <BotonesTabla pedidoId={pedido.id} estado={pedido.estado} />
      </div>
    </div>
  );
}
