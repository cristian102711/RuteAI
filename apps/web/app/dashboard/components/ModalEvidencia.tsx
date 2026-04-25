"use client";

import { useState, useRef } from "react";
import { X, Upload, Camera, CheckCircle2 } from "lucide-react";
import { marcarComoEntregado } from "../actions";
import { toast } from "sonner";

interface ModalEvidenciaProps {
  pedidoId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalEvidencia({ pedidoId, onClose, onSuccess }: ModalEvidenciaProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFotoSubida = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       const url = URL.createObjectURL(file);
       setPreviewFoto(url);
    }
  };

  const handleCompletarEntrega = async () => {
    if (!previewFoto) {
       toast.error("Por favor, sube una foto de evidencia para la entrega.");
       return;
    }

    setIsUploading(true);
    toast.loading("Subiendo evidencia a Supabase Storage...", { id: "upload-" + pedidoId });
    
    try {
      // Simulación de subida de archivo a Supabase
      await new Promise(r => setTimeout(r, 1500)); 
      
      // Actualizamos estado local
      await marcarComoEntregado(pedidoId);
      
      toast.success("Misión cumplida: Pedido entregado", { id: "upload-" + pedidoId });
      onSuccess();
    } catch {
      toast.error("Hubo un fallo al subir las evidencias", { id: "upload-" + pedidoId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop con Blur */}
      <div 
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Contenido del Modal (Glassmorphism) */}
      <div className="relative z-10 w-full max-w-md bg-zinc-900 border border-zinc-700/50 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-all animate-in fade-in zoom-in duration-300">
        
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500" />

        <div className="flex justify-between items-center p-6 border-b border-zinc-800/60 bg-zinc-950/50">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Confirmar Entrega</h2>
            <p className="text-xs text-zinc-400 mt-1">Cargar pila de evidencias a Supabase</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 border border-zinc-800 text-zinc-400 bg-zinc-950 hover:bg-zinc-800 rounded-full transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
           
           {/* Botón / Zona Ingesta Foto */}
           <div className="border border-dashed border-zinc-700 bg-zinc-950/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-colors hover:border-emerald-500/50 group relative overflow-hidden">
             
             {previewFoto ? (
               <img src={previewFoto} alt="Evidencia" className="absolute inset-0 w-full h-full object-cover opacity-80" />
             ) : (
               <>
                 <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 group-hover:border-emerald-500/50 group-hover:text-emerald-400 transition-colors shadow-inner">
                   <Camera className="w-6 h-6 text-zinc-400 group-hover:text-emerald-400" />
                 </div>
                 <div className="text-center">
                    <h3 className="font-semibold text-sm text-zinc-200">Tomar o Subir Foto</h3>
                    <p className="text-xs text-zinc-500 mt-1">Formato JPG o PNG</p>
                 </div>
               </>
             )}

             <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFotoSubida}
                ref={fileInputRef}
             />
           </div>

           {/* Simulación Cuadro de Firma */}
           <div className="flex flex-col gap-2">
             <label className="text-xs font-bold text-zinc-500 tracking-widest uppercase">Firma del Cliente</label>
             <div className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 italic">
                (Área para Canvas de Firma Digital)
             </div>
           </div>

           <button 
             onClick={handleCompletarEntrega}
             disabled={isUploading || !previewFoto}
             className="w-full py-4 mt-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] disabled:cursor-not-allowed"
           >
              {isUploading ? (
                <div className="w-5 h-5 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
              ) : (
                <><Upload className="w-5 h-5" /> Enviar y Cerrar Pedido</>
              )}
           </button>

        </div>
      </div>
    </div>
  );
}
