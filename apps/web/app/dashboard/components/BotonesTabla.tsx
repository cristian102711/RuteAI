"use client";

import { useState } from "react";
import { toast } from "sonner";
import { eliminarPedido, marcarComoEntregado, marcarEnRuta } from "../actions";
import { Trash2, CheckCircle, Send } from "lucide-react";
import Swal from "sweetalert2";
import { ModalEvidencia } from "./ModalEvidencia";

export function BotonesTabla({ pedidoId, estado }: { pedidoId: string, estado: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const handleEntregar = () => {
    // En lugar de alerta simple, abrimos la validación fotográfica
    setShowModal(true);
  };

  const handleEliminar = async () => {
    // Alerta Premium Crítica usando SweetAlert2
    const result = await Swal.fire({
      title: "¿Eliminar pedido?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f43f5e", // rose-500
      cancelButtonColor: "#27272a", // zinc-800
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      background: "#09090b",
      color: "#f4f4f5",
      customClass: {
        popup: "rounded-3xl border border-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.1)]"
      }
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

  const handleDespachar = async () => {
    const result = await Swal.fire({
      title: "¿Iniciar Despacho?",
      text: "El cliente recibirá un SMS vía Twilio con el enlace de tracking exclusivo.",
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6", // blue-500
      cancelButtonColor: "#27272a", 
      confirmButtonText: "Sí, Notificar y Despachar",
      cancelButtonText: "Cancelar",
      background: "#09090b",
      color: "#f4f4f5",
      customClass: { popup: "rounded-3xl border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.15)]" }
    });

    if (!result.isConfirmed) return;

    setIsCompleting(true);
    toast.loading("Enviando SMS vía Twilio...", { id: "ruta-" + pedidoId });
    try {
      await marcarEnRuta(pedidoId);
      toast.success("Notificación enviada. Pedido en ruta.", { id: "ruta-" + pedidoId });
    } catch {
      toast.error("Ocurrió un error al despachar", { id: "ruta-" + pedidoId });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleEliminar} 
        disabled={isDeleting || isCompleting}
        className="p-2 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/20 flex justify-center items-center w-9 h-9 text-rose-400 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95 text-[10px]" 
        title="Cancelar este pedido permanentemente"
      >
        {isDeleting ? <Spinner className="w-3.5 h-3.5 border-rose-400" /> : <Trash2 strokeWidth={2} className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />}
      </button>

      {estado === "pendiente" && (
        <button 
          onClick={handleDespachar} 
          disabled={isCompleting || isDeleting}
          className="p-2 border border-blue-500/20 bg-blue-500/5 flex justify-center items-center w-9 h-9 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95" 
          title="Notificar cliente e iniciar despacho"
        >
          {isCompleting ? <Spinner className="w-3.5 h-3.5 border-blue-400" /> : <Send strokeWidth={2} className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
        </button>
      )}

      {estado === "en_ruta" && (
        <button 
          onClick={handleEntregar} 
          disabled={isCompleting || isDeleting}
          className="p-2 border border-emerald-500/30 bg-emerald-500/10 flex justify-center items-center px-4 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95" 
          title="Confirmar entrega con evidencia"
        >
          {isCompleting ? <Spinner className="w-3.5 h-3.5 border-emerald-400" /> : <><CheckCircle strokeWidth={2} className="w-3.5 h-3.5 text-emerald-400 mr-1.5 group-hover:scale-110 transition-transform" /> <span className="text-[10px] uppercase font-bold tracking-widest">Entregar</span></>}
        </button>
      )}

      {estado === "entregado" && (
        <span className="py-1.5 px-3 flex gap-1.5 items-center border border-emerald-500/30 rounded-xl bg-emerald-500/10 shadow-inner" title="¡Entrega exitosa!">
          <CheckCircle strokeWidth={2} className="w-3.5 h-3.5 text-emerald-400" /> 
          <span className="text-[10px] font-extrabold my-auto uppercase tracking-wider text-emerald-400">Completado</span>
        </span>
      )}

      {showModal && (
        <ModalEvidencia 
          pedidoId={pedidoId} 
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function Spinner({ className }: { className: string }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-t-transparent ${className}`}></div>
  );
}
