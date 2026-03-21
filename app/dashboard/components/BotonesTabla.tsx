"use client";

import { useState } from "react";
import { toast } from "sonner";
import { eliminarPedido, marcarComoEntregado } from "../actions";
import { Trash2, CheckCircle } from "lucide-react";
import Swal from "sweetalert2";

export function BotonesTabla({ pedidoId, estado }: { pedidoId: string, estado: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleEntregar = async () => {
    // Alerta Premium usando SweetAlert2
    const result = await Swal.fire({
      title: "¿Confirmar Entrega?",
      text: "El pedido se marcará como entregado exitosamente.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981", // emerald-500
      cancelButtonColor: "#3f3f46", // zinc-700
      confirmButtonText: "Sí, entregar",
      cancelButtonText: "Cancelar",
      background: "#18181b", // zinc-900 puro
      color: "#e4e4e7" // zinc-200
    });

    if (!result.isConfirmed) return;

    setIsCompleting(true);
    toast.loading("Marcando como entregado...", { id: "entregar-" + pedidoId });
    try {
      await marcarComoEntregado(pedidoId);
      toast.success("Pedido entregado exitosamente", { id: "entregar-" + pedidoId });
    } catch {
      toast.error("Hubo un error al actualizar", { id: "entregar-" + pedidoId });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleEliminar = async () => {
    // Alerta Premium Crítica usando SweetAlert2
    const result = await Swal.fire({
      title: "¿Eliminar pedido?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444", // red-500
      cancelButtonColor: "#3f3f46", // zinc-700
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      background: "#18181b",
      color: "#e4e4e7"
    });

    if (!result.isConfirmed) return;
    
    setIsDeleting(true);
    toast.loading("Eliminando registro...", { id: "eliminar-" + pedidoId });
    try {
      await eliminarPedido(pedidoId);
      toast.success("Envío cancelado y eliminado", { id: "eliminar-" + pedidoId });
    } catch {
      toast.error("Error al eliminar", { id: "eliminar-" + pedidoId });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleEliminar} 
        disabled={isDeleting || isCompleting}
        className="p-2 border border-red-500/50 flex justify-center items-center w-8 h-8 hover:bg-red-500/20 text-red-500 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed group" 
        title="Cancelar este pedido permanentemente"
      >
        {isDeleting ? <Spinner className="w-3 h-3 border-red-500" /> : <Trash2 strokeWidth={2} className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />}
      </button>

      {estado === "pendiente" ? (
        <button 
          onClick={handleEntregar} 
          disabled={isCompleting || isDeleting}
          className="p-2 border border-blue-500/50 flex justify-center items-center w-8 h-8 hover:bg-blue-500/20 text-blue-400 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed group" 
          title="Marcar como entregado"
        >
          {isCompleting ? <Spinner className="w-3 h-3 border-blue-400" /> : <CheckCircle strokeWidth={2} className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />}
        </button>
      ) : (
        <span className="p-2 text-emerald-500 px-4 flex gap-2 items-center border border-emerald-500/20 rounded-full bg-emerald-500/10" title="¡Entrega exitosa!">
          <CheckCircle strokeWidth={2} className="w-4 h-4 text-emerald-500" /> 
          <span className="text-xs font-bold my-auto uppercase">Diligenciado</span>
        </span>
      )}
    </div>
  );
}

function Spinner({ className }: { className: string }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-t-transparent ${className}`}></div>
  );
}
